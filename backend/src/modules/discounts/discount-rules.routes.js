'use strict';

const express = require('express');
const router = express.Router();
const prisma = require('../../database/prisma');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { sendSuccess } = require('../../utils/response');
const { AppError } = require('../../utils/errors');

const { parsePagination, paginateResult } = require('../../utils/pagination');

// List discount rules
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip, take } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 100 });
    const [total, rules] = await Promise.all([
      prisma.discountRule.count(),
      prisma.discountRule.findMany({
        include: {
          customerTier: true,
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
    ]);

    const transformed = rules.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      type: r.type,
      customer_tier: r.customerTier?.name || '',
      category: r.category?.name || '',
      customerTierId: r.customerTierId,
      categoryId: r.categoryId,
      max_discount_percent: Number(r.maxDiscountPct),
      maxDiscountPct: Number(r.maxDiscountPct),
      approval_required: Number(r.maxDiscountPct) > 10,
      approval_level: Number(r.maxDiscountPct) > 15 ? 2 : 1,
      active: r.active,
      is_active: r.active,
      createdAt: r.createdAt,
    }));

    const result = paginateResult(transformed, total, page, limit);

    sendSuccess(res, 200, 'Discount rules fetched', {
      rules: result,
      data: result,
      pagination: result.pagination,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
});

// Create discount rule
router.post('/', authenticate, requireRole(['ADMIN', 'SALES_MANAGER', 'MANAGER_ADMIN']), async (req, res, next) => {
  try {
    const { name, description, type = 'TIER', customerTierId, categoryId, max_discount_percent, maxDiscountPct } = req.body;
    const discountVal = max_discount_percent !== undefined ? max_discount_percent : maxDiscountPct || 0;

    const created = await prisma.discountRule.create({
      data: {
        name,
        description,
        type,
        customerTierId: customerTierId || null,
        categoryId: categoryId || null,
        maxDiscountPct: discountVal,
        active: true,
      },
      include: {
        customerTier: true,
        category: true,
      },
    });

    sendSuccess(res, 201, 'Discount rule created', { rule: created, data: created });
  } catch (err) {
    next(err);
  }
});

// Update discount rule
router.put('/:id', authenticate, requireRole(['ADMIN', 'SALES_MANAGER', 'MANAGER_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, max_discount_percent, maxDiscountPct, active } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (max_discount_percent !== undefined || maxDiscountPct !== undefined) {
      data.maxDiscountPct = max_discount_percent !== undefined ? max_discount_percent : maxDiscountPct;
    }
    if (active !== undefined) data.active = active;

    const updated = await prisma.discountRule.update({
      where: { id },
      data,
      include: {
        customerTier: true,
        category: true,
      },
    });

    sendSuccess(res, 200, 'Discount rule updated', { rule: updated, data: updated });
  } catch (err) {
    next(err);
  }
});

// Delete discount rule
router.delete('/:id', authenticate, requireRole(['ADMIN', 'SALES_MANAGER', 'MANAGER_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.discountRule.delete({ where: { id } });
    sendSuccess(res, 200, 'Discount rule deleted', { id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
