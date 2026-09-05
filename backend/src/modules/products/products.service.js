'use strict';

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../../utils/errors');

const prisma = new PrismaClient();

exports.list = async ({ categoryId }) => {
  const where = {};
  if (categoryId) where.categoryId = categoryId;

  return prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
};

exports.getById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, variants: true },
  });
  if (!product) throw new AppError('Product not found', 404);
  return product;
};

exports.create = async (data) => {
  if (data.sku) {
    const exists = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (exists) throw new AppError('SKU already exists', 409);
  }
  return prisma.product.create({ data, include: { category: true } });
};

exports.update = async (id, data) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError('Product not found', 404);

  if (data.sku && data.sku !== existing.sku) {
    const exists = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (exists) throw new AppError('SKU already exists', 409);
  }

  return prisma.product.update({ where: { id }, data, include: { category: true } });
};
