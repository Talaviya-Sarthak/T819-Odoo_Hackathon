'use strict';

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errors');

const prisma = new PrismaClient();

exports.getRecommendations = async (quotationId) => {
  const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
  if (!quotation) throw new AppError('Quotation not found', 404);

  return prisma.recommendation.findMany({
    where: { quotationId },
    include: { product: true },
    orderBy: { score: 'desc' },
  });
};

exports.addToQuotation = async (recommendationId) => {
  const recommendation = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
    include: { product: true, quotation: true },
  });
  if (!recommendation) throw new AppError('Recommendation not found', 404);
  if (recommendation.status !== 'PENDING') throw new AppError('Recommendation already processed', 400);

  const product = recommendation.product;

  await prisma.quotationLine.create({
    data: {
      quotationId: recommendation.quotationId,
      productId: product.id,
      quantity: 1,
      unitPrice: product.basePrice,
      costPrice: product.costPrice,
      taxPercent: product.taxPercent,
      subtotal: product.basePrice,
      total: product.basePrice + (product.basePrice * product.taxPercent / 100),
      margin: product.basePrice - product.costPrice,
      marginPercent: product.basePrice > 0 ? ((product.basePrice - product.costPrice) / product.basePrice) * 100 : 0,
    },
  });

  return prisma.recommendation.update({
    where: { id: recommendationId },
    data: { status: 'ADDED' },
  });
};

exports.dismiss = async (recommendationId) => {
  const recommendation = await prisma.recommendation.findUnique({ where: { id: recommendationId } });
  if (!recommendation) throw new AppError('Recommendation not found', 404);

  return prisma.recommendation.update({
    where: { id: recommendationId },
    data: { status: 'DISMISSED' },
  });
};
