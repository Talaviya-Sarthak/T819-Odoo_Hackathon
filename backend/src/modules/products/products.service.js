'use strict';

const { PrismaClient, Prisma } = require('@prisma/client');
const { AppError } = require('../../utils/errors');
const { logAudit } = require('../../services/audit.service');
const { generateKey, cache } = require('../../cache');
const prisma = require('../../database/prisma');

const PRODUCTS_LIST_TTL = 60; // 1 minute

exports.list = async ({ categoryId, search, active, limit = 100, offset = 0 } = {}) => {
  const where = {};
  if (categoryId) where.categoryId = categoryId;

  const cacheKey = generateKey(
    'products:list',
    categoryId,
    search,
    active,
    limit,
    offset
  );

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  // Store in cache with 1-minute TTL (products change relatively frequently)
  cache.set(cacheKey, result, PRODUCTS_LIST_TTL);

  return result;
};

exports.getById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, variants: true },
  });
  if (!product) throw new AppError('Product not found', 404);
  return product;
};

exports.create = async (data, user = null) => {
  if (!data.name) throw new AppError('Product name is required', 400);
  if (!data.sku) throw new AppError('Product SKU is required', 400);
  if (data.basePrice === undefined) throw new AppError('Base price is required', 400);

  const exists = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (exists) throw new AppError('SKU already exists', 409);

  const product = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      description: data.description || null,
      unit: data.unit || 'unit',
      basePrice: new Prisma.Decimal(data.basePrice),
      costPrice: new Prisma.Decimal(data.costPrice !== undefined ? data.costPrice : 0),
      taxRate: new Prisma.Decimal(data.taxRate !== undefined ? data.taxRate : 0),
      categoryId: data.categoryId || null,
      active: data.active !== undefined ? Boolean(data.active) : true,
      variants: data.variants && Array.isArray(data.variants)
        ? {
            create: data.variants.map((v) => ({
              sku: v.sku,
              attributes: v.attributes || {},
              priceAdjustment: new Prisma.Decimal(v.priceAdjustment || 0),
              active: v.active !== undefined ? Boolean(v.active) : true,
            })),
          }
        : undefined,
    },
    include: { category: true, variants: true },
  });

  // Invalidate products list cache
  try {
    cache.delete('products:list');
  } catch (e) {
    // Cache deletion failure should not break the operation
  }

  await logAudit({
    userId: user?.id,
    action: 'PRODUCT_CREATE',
    entityType: 'PRODUCT',
    entityId: product.id,
    newValues: { name: product.name, sku: product.sku, basePrice: product.basePrice.toString() },
  });

  return product;
};

exports.update = async (id, data, user = null) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError('Product not found', 404);

  if (data.sku && data.sku !== existing.sku) {
    const exists = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (exists) throw new AppError('SKU already exists', 409);
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.basePrice !== undefined) updateData.basePrice = new Prisma.Decimal(data.basePrice);
  if (data.costPrice !== undefined) updateData.costPrice = new Prisma.Decimal(data.costPrice);
  if (data.taxRate !== undefined) updateData.taxRate = new Prisma.Decimal(data.taxRate);
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.active !== undefined) updateData.active = Boolean(data.active);

  const updated = await prisma.product.update({
    where: { id },
    data: updateData,
    include: { category: true, variants: true },
  });

  // Invalidate products list cache
  try {
    cache.delete('products:list');
  } catch (e) {
    // Cache deletion failure should not break the operation
  }

  await logAudit({
    userId: user?.id,
    action: 'PRODUCT_UPDATE',
    entityType: 'PRODUCT',
    entityId: id,
    oldValues: { name: existing.name, basePrice: existing.basePrice.toString() },
    newValues: updateData,
  });

  return updated;
};

exports.listCategories = async () => {
  return prisma.category.findMany({
    where: { active: true },
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
};

exports.createCategory = async (data, user = null) => {
  if (!data.name) throw new AppError('Category name is required', 400);

  const category = await prisma.category.create({
    data: {
      name: data.name,
      description: data.description || null,
      active: data.active !== undefined ? Boolean(data.active) : true,
    },
  });

  await logAudit({
    userId: user?.id,
    action: 'CATEGORY_CREATE',
    entityType: 'CATEGORY',
    entityId: category.id,
    newValues: { name: category.name },
  });

  return category;
};
