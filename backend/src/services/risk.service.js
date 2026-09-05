'use strict';

/**
 * Evaluates risk score (0-100) and risk level for a quotation based on:
 * - discount excess
 * - quote value
 * - margin impact
 * - number of violating lines
 * - category severity
 * - customer tier
 *
 * @param {Object} params
 * @param {number} params.maxExcess
 * @param {number} params.totalAmount
 * @param {number} params.grossMarginPercent
 * @param {number} params.violatingLineCount
 * @param {Array<string>} params.violatingCategories
 * @param {string} params.customerTierName
 * @returns {{ riskScore: number, riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', reasons: Array<string>, approvalRequired: boolean, requiredRoles: Array<string> }}
 */
function calculateRisk({
  maxExcess = 0,
  totalAmount = 0,
  grossMarginPercent = 100,
  violatingLineCount = 0,
  violatingCategories = [],
  customerTierName = 'Standard',
}) {
  let score = 0;
  const reasons = [];

  // 1. Discount Excess Evaluation
  if (maxExcess <= 0) {
    // No excess discount
  } else if (maxExcess <= 5) {
    score += 35;
    reasons.push(`Discount exceeds allowed limit by ${maxExcess.toFixed(1)}% (Low/Medium severity)`);
  } else if (maxExcess <= 10) {
    score += 65; // Places deal directly into HIGH risk (60-79)
    reasons.push(`Significant discount excess of ${maxExcess.toFixed(1)}% exceeds standard policy`);
  } else {
    score += 85; // Places deal into CRITICAL risk (80+)
    reasons.push(`Severe discount excess of ${maxExcess.toFixed(1)}% exceeds maximum allowable threshold`);
  }

  // 2. High Quote Value Impact
  if (totalAmount >= 100000) {
    score += 15;
    reasons.push(`High deal value ($${Number(totalAmount).toLocaleString()}) increases organizational exposure`);
  } else if (totalAmount >= 50000) {
    score += 8;
    reasons.push(`Significant deal value ($${Number(totalAmount).toLocaleString()})`);
  }

  // 3. Margin Degradation Impact
  if (grossMarginPercent <= 10) {
    score += 20;
    reasons.push(`Critically low gross margin (${grossMarginPercent.toFixed(1)}%)`);
  } else if (grossMarginPercent <= 20) {
    score += 10;
    reasons.push(`Low gross margin (${grossMarginPercent.toFixed(1)}%)`);
  }

  // 4. Number of Violating Lines
  if (violatingLineCount > 1) {
    score += 5 * Math.min(violatingLineCount - 1, 3);
    reasons.push(`Multiple order lines (${violatingLineCount}) exceed approved discounts`);
  }

  // 5. Category Severity (Services discounts carry high cost of delivery)
  if (violatingCategories.some(c => c && c.toLowerCase().includes('service'))) {
    score += 5;
    reasons.push('Service category discount excess impacts labor and delivery costs');
  }

  // Clamp score to 0 - 100
  score = Math.min(Math.max(score, 0), 100);

  // Determine Risk Level
  let riskLevel = 'LOW';
  let requiredRoles = [];
  let approvalRequired = false;

  if (score >= 80) {
    riskLevel = 'CRITICAL';
    approvalRequired = true;
    requiredRoles = ['SALES_MANAGER', 'FINANCE', 'ADMIN'];
  } else if (score >= 60) {
    riskLevel = 'HIGH';
    approvalRequired = true;
    requiredRoles = ['SALES_MANAGER', 'FINANCE'];
  } else if (score >= 25) {
    riskLevel = 'MEDIUM';
    approvalRequired = true;
    requiredRoles = ['SALES_MANAGER'];
  } else if (maxExcess > 0) {
    riskLevel = 'LOW';
    approvalRequired = true;
    requiredRoles = ['SALES_MANAGER'];
  } else {
    riskLevel = 'LOW';
    approvalRequired = false;
    requiredRoles = [];
  }

  if (reasons.length === 0) {
    reasons.push('Standard pricing within policy limits');
  }

  return {
    riskScore: Math.round(score),
    riskLevel,
    reasons,
    approvalRequired,
    requiredRoles,
  };
}

module.exports = {
  calculateRisk,
};
