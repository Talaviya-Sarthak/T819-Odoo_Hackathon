'use strict';

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errors');

const prisma = new PrismaClient();

exports.list = async ({ status, customerId, salesRepId }) => {
  const where = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (salesRepId) where.salesRepId = salesRepId;

  return prisma.quotation.findMany({
    where,
    include: { customer: true, salesRep: true },
    orderBy: { createdAt: 'desc' },
  });
};

exports.getById = async (id) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      salesRep: true,
      lines: { include: { product: true, variant: true } },
    },
  });
  if (!quotation) throw new AppError('Quotation not found', 404);
  return quotation;
};

exports.create = async (data) => {
  const count = await prisma.quotation.count();
  const quotationNumber = `QUO-${String(count + 1).padStart(5, '0')}`;

  const lines = data.lines || [];
  const { lines: _, ...quotationData } = data;

  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  let totalCost = 0;

  const processedLines = lines.map((line) => {
    const lineSubtotal = line.quantity * line.unitPrice;
    const lineDiscount = lineSubtotal * (line.discountPercent || 0) / 100;
    const lineNet = lineSubtotal - lineDiscount;
    const lineTax = lineNet * (line.taxPercent || 0) / 100;
    const lineTotal = lineNet + lineTax;
    const lineCost = line.quantity * (line.costPrice || 0);
    const lineMargin = lineTotal - lineCost;

    subtotal += lineSubtotal;
    discountTotal += lineDiscount;
    taxTotal += lineTax;
    totalCost += lineCost;

    return {
      ...line,
      discountAmount: lineDiscount,
      subtotal: lineSubtotal,
      total: lineTotal,
      margin: lineMargin,
      marginPercent: lineTotal > 0 ? (lineMargin / lineTotal) * 100 : 0,
    };
  });

  const totalAmount = subtotal - discountTotal + taxTotal;
  const grossMargin = totalAmount - totalCost;
  const grossMarginPercent = totalAmount > 0 ? (grossMargin / totalAmount) * 100 : 0;

  return prisma.quotation.create({
    data: {
      ...quotationData,
      quotationNumber,
      subtotal,
      discountTotal,
      taxTotal,
      totalAmount,
      totalCost,
      grossMargin,
      grossMarginPercent,
      lines: { create: processedLines },
    },
    include: { customer: true, salesRep: true, lines: true },
  });
};

exports.update = async (id, data) => {
  const existing = await prisma.quotation.findUnique({ where: { id } });
  if (!existing) throw new AppError('Quotation not found', 404);
  if (existing.status !== 'DRAFT') throw new AppError('Only draft quotations can be updated', 400);

  return prisma.quotation.update({
    where: { id },
    data,
    include: { customer: true, salesRep: true, lines: true },
  });
};

exports.submit = async (id) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { customer: { include: { tier: true } } },
  });
  if (!quotation) throw new AppError('Quotation not found', 404);
  if (quotation.status !== 'DRAFT' && quotation.status !== 'NEGOTIATION') {
    throw new AppError('Quotation cannot be submitted from current status', 400);
  }

  let approvalRequired = false;

  const approvalRule = await prisma.approvalRule.findFirst({
    where: {
      isActive: true,
      minAmount: { lte: quotation.totalAmount },
      OR: [
        { maxAmount: null },
        { maxAmount: { gte: quotation.totalAmount } },
      ],
    },
    orderBy: { minAmount: 'desc' },
  });

  if (approvalRule) {
    approvalRequired = true;
  }

  const updateData = {
    status: 'PENDING_APPROVAL',
    approvalRequired,
  };

  if (approvalRequired && approvalRule) {
    await prisma.approvalRequest.create({
      data: {
        level: approvalRule.requiredLevel,
        quotationId: id,
        requestedById: quotation.salesRepId,
        approvalRuleId: approvalRule.id,
      },
    });
  }

  return prisma.quotation.update({
    where: { id },
    data: updateData,
    include: { customer: true, salesRep: true, lines: true },
  });
};

exports.confirm = async (id) => {
  const quotation = await prisma.quotation.findUnique({ where: { id } });
  if (!quotation) throw new AppError('Quotation not found', 404);
  if (quotation.status !== 'APPROVED') throw new AppError('Only approved quotations can be confirmed', 400);

  return prisma.quotation.update({
    where: { id },
    data: { status: 'CUSTOMER_CONFIRMED', confirmedAt: new Date() },
    include: { customer: true, salesRep: true, lines: true },
  });
};
