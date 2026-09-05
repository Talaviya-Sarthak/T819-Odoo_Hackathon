'use strict';

const { Prisma } = require('@prisma/client');
const Decimal = Prisma.Decimal;

/**
 * Calculates financial amounts for a single quotation line item using Decimal precision.
 * 
 * Formula:
 * lineSubtotal = quantity × unitPrice
 * discountAmount = lineSubtotal × discountPercent / 100
 * taxableAmount = lineSubtotal - discountAmount
 * taxAmount = taxableAmount × taxRate / 100
 * lineTotal = lineSubtotal - discountAmount + taxAmount
 * cost = quantity × unitCost
 * marginAmount = lineTotal - cost
 * marginPercent = lineTotal > 0 ? (marginAmount / lineTotal) * 100 : 0
 * 
 * @param {Object} line
 * @returns {Object} line item with calculated Decimal values
 */
function calculateLine(line) {
  const quantity = new Decimal(line.quantity || 1);
  const unitPrice = new Decimal(line.unitPrice !== undefined ? line.unitPrice : 0);
  const unitCost = new Decimal(line.unitCost !== undefined ? line.unitCost : 0);
  const discountPercent = new Decimal(line.discountPercent !== undefined ? line.discountPercent : 0);
  const taxRate = new Decimal(line.taxRate !== undefined ? line.taxRate : 0);

  // 1. subtotal = quantity * unitPrice
  const lineSubtotal = quantity.mul(unitPrice).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // 2. discountAmount = lineSubtotal * discountPercent / 100
  const discountAmount = lineSubtotal.mul(discountPercent).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // 3. taxableAmount = lineSubtotal - discountAmount
  const taxableAmount = lineSubtotal.sub(discountAmount);

  // 4. tax = taxableAmount * taxRate / 100
  const taxAmount = taxableAmount.mul(taxRate).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // 5. lineTotal = lineSubtotal - discountAmount + taxAmount
  const lineTotal = lineSubtotal.sub(discountAmount).add(taxAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // 6. cost = quantity * unitCost
  const lineCost = quantity.mul(unitCost).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // 7. marginAmount = lineTotal - cost
  const marginAmount = lineTotal.sub(lineCost).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // 8. marginPercent = lineTotal > 0 ? (marginAmount / lineTotal) * 100 : 0
  const marginPercent = lineTotal.gt(0)
    ? marginAmount.div(lineTotal).mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    : new Decimal(0);

  return {
    ...line,
    quantity: quantity.toNumber(),
    unitPrice,
    unitCost,
    discountPercent,
    discountAmount,
    taxRate,
    taxAmount,
    lineSubtotal,
    lineTotal,
    marginAmount,
    lineCost,
    marginPercent,
    billingType: line.billingType || 'ONE_TIME',
  };
}

/**
 * Calculates complete financial totals for a quotation and its line items.
 * 
 * @param {Array<Object>} lines 
 * @returns {{ processedLines: Array<Object>, totals: Object }}
 */
function calculateQuotation(lines = []) {
  let subtotal = new Decimal(0);
  let discountAmount = new Decimal(0);
  let taxAmount = new Decimal(0);
  let totalAmount = new Decimal(0);
  let totalCost = new Decimal(0);

  const processedLines = lines.map((l) => {
    const calc = calculateLine(l);
    subtotal = subtotal.add(calc.lineSubtotal);
    discountAmount = discountAmount.add(calc.discountAmount);
    taxAmount = taxAmount.add(calc.taxAmount);
    totalAmount = totalAmount.add(calc.lineTotal);
    totalCost = totalCost.add(calc.lineCost);
    return calc;
  });

  const grossMargin = totalAmount.sub(totalCost).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const marginPercentage = totalAmount.gt(0)
    ? grossMargin.div(totalAmount).mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    : new Decimal(0);

  return {
    processedLines,
    totals: {
      subtotal: subtotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
      discountAmount: discountAmount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
      taxAmount: taxAmount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
      totalAmount: totalAmount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
      totalCost: totalCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
      grossMargin,
      marginPercentage,
    },
  };
}

module.exports = {
  calculateLine,
  calculateQuotation,
  Decimal,
};
