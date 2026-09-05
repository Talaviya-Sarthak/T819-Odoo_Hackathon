'use strict';

const { calculateRisk } = require('./risk.service');
const { AppError } = require('../utils/errors');
const prisma = require('../database/prisma');

/**
 * Checks quotation discounts against database discount rules and calculates risk & governance requirements.
 *
 * @param {string} quotationId 
 * @returns {Promise<Object>}
 */
async function checkQuotationDiscounts(quotationId) {
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

  // Load active discount rules from database
  const discountRules = await prisma.discountRule.findMany({
    where: { active: true },
  });

  const tierRules = discountRules.filter((r) => r.type === 'TIER' && r.customerTierId);
  const categoryRules = discountRules.filter((r) => r.type === 'CATEGORY' && r.categoryId);

  const customerTier = quotation.customer?.tier;
  const tierRule = customerTier
    ? tierRules.find((r) => r.customerTierId === customerTier.id)
    : null;
  const tierMaxPct = tierRule
    ? Number(tierRule.maxDiscountPct)
    : customerTier
    ? Number(customerTier.discountPct)
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
      ? categoryRules.find((r) => r.categoryId === category.id)
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
    current: reportCurrent,
    excess: maxExcess,
    affectedLines,
    risk: riskResult.riskLevel,
    riskScore: riskResult.riskScore,
    approvalRequired: riskResult.approvalRequired,
    requiredRoles: riskResult.requiredRoles,
    reason: riskResult.reasons.join('. '),
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
};
