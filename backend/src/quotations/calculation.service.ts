import { Decimal } from '@prisma/client/runtime/library';

export interface LineCalculation {
  lineSubtotal: Decimal;
  discountAmount: Decimal;
  taxAmount: Decimal;
  lineTotal: Decimal;
  costTotal: Decimal;
  marginAmount: Decimal;
  marginPercentage: Decimal;
}

export function calculateLineTotals(params: {
  quantity: number;
  unitPrice: Decimal;
  unitCost: Decimal;
  discountPercent: Decimal;
  taxRate: Decimal;
}): LineCalculation {
  const { quantity, unitPrice, unitCost, discountPercent, taxRate } = params;

  const lineSubtotal = unitPrice.mul(quantity);
  const discountAmount = lineSubtotal.mul(discountPercent).div(100);
  const afterDiscount = lineSubtotal.sub(discountAmount);
  const taxAmount = afterDiscount.mul(taxRate).div(100);
  const lineTotal = afterDiscount.add(taxAmount);

  const costTotal = unitCost.mul(quantity);
  const marginAmount = lineTotal.sub(costTotal);
  const marginPercentage = lineTotal.greaterThan(0)
    ? marginAmount.div(lineTotal).mul(100)
    : new Decimal(0);

  return {
    lineSubtotal,
    discountAmount,
    taxAmount,
    lineTotal,
    costTotal,
    marginAmount,
    marginPercentage,
  };
}

export function calculateQuotationTotals(lines: Array<{
  quantity: number;
  unitPrice: Decimal;
  unitCost: Decimal;
  discountPercent: Decimal;
  taxRate: Decimal;
}>): {
  subtotal: Decimal;
  discountAmount: Decimal;
  taxAmount: Decimal;
  totalAmount: Decimal;
  totalCost: Decimal;
  grossMargin: Decimal;
  marginPercentage: Decimal;
} {
  let subtotal = new Decimal(0);
  let discountAmount = new Decimal(0);
  let taxAmount = new Decimal(0);
  let totalAmount = new Decimal(0);
  let totalCost = new Decimal(0);

  for (const line of lines) {
    const calc = calculateLineTotals(line);
    subtotal = subtotal.add(calc.lineSubtotal);
    discountAmount = discountAmount.add(calc.discountAmount);
    taxAmount = taxAmount.add(calc.taxAmount);
    totalAmount = totalAmount.add(calc.lineTotal);
    totalCost = totalCost.add(calc.costTotal);
  }

  const grossMargin = totalAmount.sub(totalCost);
  const marginPercentage = totalAmount.greaterThan(0)
    ? grossMargin.div(totalAmount).mul(100)
    : new Decimal(0);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
    totalCost,
    grossMargin,
    marginPercentage,
  };
}
