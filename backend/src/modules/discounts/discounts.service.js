'use strict';

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errors');

const prisma = new PrismaClient();

exports.checkDiscount = async (quotationId) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: { include: { tier: true } },
      lines: { include: { product: { include: { category: true } } } },
    },
  });
  if (!quotation) throw new AppError('Quotation not found', 404);

  const results = [];
  const tierId = quotation.customer?.tierId;

  for (const line of quotation.lines) {
    const categoryId = line.product?.categoryId;

    const rules = await prisma.discountRule.findMany({
      where: {
        OR: [
          { customerTierId: tierId },
          { categoryId },
          { customerTierId: null, categoryId: null },
        ],
      },
      include: { customerTier: true, category: true },
    });

    for (const rule of rules) {
      if (line.discountPercent <= rule.maxDiscountPercent) {
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          maxDiscount: rule.maxDiscountPercent,
          currentDiscount: line.discountPercent,
          approvalRequired: rule.approvalRequired,
          approvalLevel: rule.approvalLevel,
          tier: rule.customerTier?.name || null,
          category: rule.category?.name || null,
        });
      }
    }
  }

  return {
    quotationId,
    customerTier: quotation.customer?.tier?.name || 'None',
    discountChecks: results,
    totalDiscount: quotation.discountTotal,
    totalAmount: quotation.totalAmount,
  };
};
