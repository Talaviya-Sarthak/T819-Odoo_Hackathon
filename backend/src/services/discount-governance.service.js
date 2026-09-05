'use strict';

const { calculateRisk } = require('./risk.service');
const { AppError } = require('../utils/errors');
const { generateKey, cache } = require('../cache');
const { Prisma } = require('@prisma/client');
const prisma = require('../database/prisma');

/**
 * Discount rules cache.
 * Discount rules are relatively static reference data that changes infrequently.
 * Cache TTL: 5 minutes (can be adjusted based on how often rules change).
 */
const DISCOUNT_RULES_TTL = 5 * 60; // 5 minutes

const discountRulesCache = {
  rules: new Map(),
  lastRefreshed: 0,

  async getRules() {
    const now = Date.now();
    const elapsed = now - this.lastRefreshed;

    // If cache is valid (within TTL), return cached rules
    if (elapsed < DISCOUNT_RULES_TTL * 1000 && this.rules.size > 0) {
      return { rules: Array.from(this.rules.values()), fromCache: true };
    }

    // Fetch fresh rules from database
    const rules = await prisma.discountRule.findMany({
      where: { active: true },
    });

    // Store in cache
    this.rules.clear();
    for (const rule of rules) {
      this.rules.set(rule.id, rule);
    }
    this.lastRefreshed = now;

    return { rules, fromCache: false };
  },

  async getTiersRules(tierId) {
    const { rules } = await this.getRules();
    return rules.filter((r) => r.type === 'TIER' && r.customerTierId === tierId);
  },

  async getCategoryRules(categoryId) {
    const { rules } = await this.getRules();
    return rules.filter((r) => r.type === 'CATEGORY' && r.categoryId === categoryId);
  },

  invalidate() {
    this.rules.clear();
    this.lastRefreshed = 0;
    return this;
  },
};

/**
 * Checks quotation discounts against database discount rules and calculates risk & governance requirements.
 * Now with cache support for discount rules.
 *
 * @param {string} quotationId
 * @returns {Promise<Object>}
 */
async function checkQuotationDiscounts(quotationId) {
  // Check if we have cached discount rules first
  const rulesResult = await discountRulesCache.getRules();
  const discountRules = rulesResult.rules;

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: { include: { tier: true } },
      lines: {
        include: {
          product: {
            include: { category: true },
          },
        },
      },
    },
  });

  if (!quotation) {
    throw new AppError('Quotation not found', 404);
  }

  const customerTier = quotation.customer?.tier;
  const tierRules = discountRules.filter((r) => r.type === 'TIER' && r.customerTierId);
  const categoryRules = discountRules.filter((r) => r.type === 'CATEGORY' && r.categoryId);

  // Pre-index tier rules by customerTierId for faster lookup
  const tierRuleMap = new Map();
  for (const rule of tierRules) {
    if (rule.customerTierId) {
      if (!tierRuleMap.has(rule.customerTierId)) {
        tierRuleMap.set(rule.customerTierId, rule);
      }
    }
  }

  // Pre-index category rules by categoryId for faster lookup
  const categoryRuleMap = new Map();
  for (const rule of categoryRules) {
    if (rule.categoryId) {
      if (!categoryRuleMap.has(rule.categoryId)) {
        categoryRuleMap.set(rule.categoryId, rule);
      }
    }
  }

  const tierMaxPct = customerTier
    ? tierRuleMap.get(customerTier.id)
      ? Number(tierRuleMap.get(customerTier.id).maxDiscountPct)
      : Number(customerTier.discountPct)
    : 0;

  const affectedLines = [];
  const lineDetails = [];
  let maxExcess = 0;
  let highestViolatingCurrent = 0;
  let highestViolatingAllowed = 0;
  const violatingCategories = [];

  for (const line of quotation.lines) {
    const product = line.product;
    const category = product?.category;
    const currentDiscount = Number(line.discountPercent || 0);

    const catRule = category
      ? categoryRuleMap.get(category.id)
      : null;
    const catMaxPct = catRule ? Number(catRule.maxDiscountPct) : null;

    // Allowed discount is the governing limit:
    // If category has a specific limit, policy enforces the tighter constraint between tier and category
    let allowedDiscount = 0;
    if (catMaxPct !== null && tierMaxPct > 0) {
      allowedDiscount = Math.min(tierMaxPct, catMaxPct);
    } else if (catMaxPct !== null) {
      allowedDiscount = catMaxPct;
    } else if (tierMaxPct > 0) {
      allowedDiscount = tierMaxPct;
    }

    const excess = currentDiscount > allowedDiscount
      ? Number((currentDiscount - allowedDiscount).toFixed(2))
      : 0;

    const detail = {
      lineId: line.id,
      productName: product?.name || 'Unknown',
      sku: product?.sku || '',
      category: category?.name || 'Uncategorized',
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice),
      currentDiscount,
      allowedDiscount,
      excess,
      isViolating: excess > 0,
    };

    lineDetails.push(detail);

    if (excess > 0) {
      affectedLines.push({
        lineId: line.id,
        productName: product?.name,
        sku: product?.sku,
        category: category?.name,
        requestedDiscount: currentDiscount,
        allowedDiscount,
        excessPercentage: excess,
      });

      if (category?.name) {
        violatingCategories.push(category.name);
      }

      if (excess > maxExcess) {
        maxExcess = excess;
        highestViolatingCurrent = currentDiscount;
        highestViolatingAllowed = allowedDiscount;
      }
    }
  }

  // Calculate gross margin percentage
  const totalAmount = Number(quotation.totalAmount);
  const grossMarginPercent = Number(quotation.marginPercentage || 0);

  // Evaluate risk using centralized Risk Engine
  const riskResult = calculateRisk({
    maxExcess,
    totalAmount,
    grossMarginPercent,
    violatingLineCount: affectedLines.length,
    violatingCategories,
    customerTierName: customerTier?.name || 'Standard',
  });

  // Default allowed / current values when no violation exists
  const reportAllowed = affectedLines.length > 0 ? highestViolatingAllowed : tierMaxPct;
  const reportCurrent = affectedLines.length > 0 ? highestViolatingCurrent : Math.max(...quotation.lines.map(l => Number(l.discountPercent || 0)), 0);

  return {
    allowed: reportAllowed,
    allowedDiscount: reportAllowed,
    current: reportCurrent,
    requestedDiscount: reportCurrent,
    excess: maxExcess,
    excessDiscount: maxExcess,
    affectedLines,
    risk: riskResult.riskLevel,
    riskLevel: riskResult.riskLevel,
    riskScore: riskResult.riskScore,
    approvalRequired: riskResult.approvalRequired,
    requiresApproval: riskResult.approvalRequired,
    requiredRoles: riskResult.requiredRoles,
    approvalRoles: riskResult.requiredRoles,
    reason: riskResult.reasons.join('. '),
    reasons: riskResult.reasons,
    lineDetails,
    summary: {
      quotationNumber: quotation.quotationNumber,
      customerTier: customerTier?.name || 'None',
      totalAmount,
      grossMarginPercent,
      violatingLinesCount: affectedLines.length,
    },
  };
}

module.exports = {
  checkQuotationDiscounts,
  discountRulesCache,
  DISCOUNT_RULES_TTL,
  invalidateDiscountRulesCache: () => discountRulesCache.invalidate(),
};
