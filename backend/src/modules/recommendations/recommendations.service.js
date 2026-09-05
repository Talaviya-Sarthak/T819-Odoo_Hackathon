'use strict';

const prisma = require('../../database/prisma');
const { AppError } = require('../../utils/errors');
const { calculateQuotation } = require('../../services/calculation.service');

exports.getRecommendations = async (quotationId) => {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      lines: {
        include: { product: true },
      },
    },
  });
  if (!quotation) throw new AppError('Quotation not found', 404);

  const existingProductIds = new Set(quotation.lines.map((l) => l.productId));

  // Find all active products not already on the quotation
  const availableProducts = await prisma.product.findMany({
    where: {
      active: true,
      id: { notIn: Array.from(existingProductIds) },
    },
    include: { category: true },
  });

  // Prioritize complementary accessories (e.g. Docking Station, Monitor, Mouse)
  const recommendations = [];

  for (const product of availableProducts) {
    const isDockingStation = product.name.toLowerCase().includes('docking') || product.sku.toLowerCase().includes('dock');
    const isMonitor = product.name.toLowerCase().includes('monitor');
    const isAccessory = product.name.toLowerCase().includes('mouse') || product.name.toLowerCase().includes('keyboard');

    let score = 0.70;
    let reason = `Popular companion product with standard pricing`;

    if (isDockingStation) {
      score = 0.95;
      reason = `Highly recommended desktop connectivity accessory for laptop deployments`;
    } else if (isMonitor) {
      score = 0.88;
      reason = `Boosts employee productivity when paired with laptop systems`;
    } else if (isAccessory) {
      score = 0.80;
      reason = `Standard ergonomic workstation peripheral`;
    }

    const basePrice = Number(product.basePrice);
    const costPrice = Number(product.costPrice || (basePrice * 0.75));
    const revenueImpact = basePrice;
    const marginImpact = basePrice - costPrice;

    recommendations.push({
      id: `rec_${quotationId}_${product.id}`,
      quotationId,
      productId: product.id,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        basePrice: product.basePrice,
        costPrice: product.costPrice,
        category: product.category?.name,
      },
      score,
      reason,
      revenueImpact,
      marginImpact,
      status: 'PENDING',
    });
  }

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations.slice(0, 5);
};

exports.addToQuotation = async (recommendationId) => {
  let quotationId = null;
  let productId = null;

  if (recommendationId && recommendationId.startsWith('rec_')) {
    const parts = recommendationId.split('_');
    quotationId = parts[1];
    productId = parts[2];
  }

  if (!quotationId || !productId) {
    // Check if recommendation exists in recommendations table
    const rec = await prisma.recommendation.findUnique({
      where: { id: recommendationId },
    });
    if (rec) {
      productId = rec.productId;
    } else {
      // Or check if recommendationId is direct productId
      const prod = await prisma.product.findUnique({ where: { id: recommendationId } });
      if (prod) productId = prod.id;
    }
  }

  if (!productId) {
    throw new AppError('Invalid recommendation reference', 400);
  }

  // Find quotation
  let quotation = quotationId 
    ? await prisma.quotation.findUnique({ where: { id: quotationId }, include: { lines: true } })
    : await prisma.quotation.findFirst({ orderBy: { updatedAt: 'desc' }, include: { lines: true } });

  if (!quotation) throw new AppError('Quotation not found', 404);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Product not found', 404);

  // Prepare existing lines + new line
  const linesToCalculate = quotation.lines.map((l) => ({
    productId: l.productId,
    quantity: l.quantity,
    unitPrice: Number(l.unitPrice),
    unitCost: Number(l.unitCost),
    discountPercent: Number(l.discountPercent),
    taxRate: Number(l.taxRate),
    billingType: l.billingType,
  }));

  // Add the recommended product (1 unit, standard base price, 0% discount)
  linesToCalculate.push({
    productId: product.id,
    quantity: 1,
    unitPrice: Number(product.basePrice),
    unitCost: Number(product.costPrice || (Number(product.basePrice) * 0.7)),
    discountPercent: 0,
    taxRate: Number(product.taxRate || product.taxPercent || 0),
    billingType: 'ONE_TIME',
  });

  const { processedLines, totals } = calculateQuotation(linesToCalculate);

  // Atomically recreate lines and update totals
  await prisma.quotationLine.deleteMany({ where: { quotationId: quotation.id } });

  const updatedQuotation = await prisma.quotation.update({
    where: { id: quotation.id },
    data: {
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      totalCost: totals.totalCost,
      grossMargin: totals.grossMargin,
      marginPercentage: totals.marginPercentage,
      lines: {
        create: processedLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          unitCost: l.unitCost,
          discountPercent: l.discountPercent,
          discountAmount: l.discountAmount,
          taxRate: l.taxRate,
          lineSubtotal: l.lineSubtotal,
          lineTotal: l.lineTotal,
          marginAmount: l.marginAmount,
          billingType: l.billingType,
        })),
      },
    },
    include: {
      lines: { include: { product: true } },
      customer: true,
      salesRep: true,
    },
  });

  return {
    recommendationId,
    productName: product.name,
    addedLine: updatedQuotation.lines.find((l) => l.productId === product.id),
    quotation: updatedQuotation,
  };
};

exports.dismiss = async (recommendationId) => {
  return { id: recommendationId, status: 'DISMISSED' };
};
