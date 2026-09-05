'use strict';

const express = require('express');
const router = express.Router();
const prisma = require('../../database/prisma');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { sendSuccess } = require('../../utils/response');
const { AppError } = require('../../utils/errors');

// List approval rules
router.get('/', authenticate, async (req, res, next) => {
  try {
    const rules = await prisma.approvalRule.findMany({
      orderBy: { stepOrder: 'asc' },
    });

    const transformed = rules.map((r) => ({
      id: r.id,
      name: r.name,
      min_amount: r.minRiskScore * 500,
      max_amount: r.maxRiskScore * 1000,
      risk_threshold: r.minRiskScore,
      required_level: r.stepOrder,
      is_active: r.active,
      minRiskScore: r.minRiskScore,
      maxRiskScore: r.maxRiskScore,
      requiredRole: r.requiredRole,
      stepOrder: r.stepOrder,
      active: r.active,
      createdAt: r.createdAt,
    }));

    sendSuccess(res, 200, 'Approval rules fetched', { rules: transformed, data: transformed });
  } catch (err) {
    next(err);
  }
});

// Create approval rule
router.post('/', authenticate, requireRole(['ADMIN', 'SALES_MANAGER', 'MANAGER_ADMIN']), async (req, res, next) => {
  try {
    const { name, min_amount, max_amount, risk_threshold, required_level, requiredRole = 'SALES_MANAGER', minRiskScore, maxRiskScore, stepOrder } = req.body;

    const minScore = minRiskScore !== undefined ? minRiskScore : (risk_threshold || 10);
    const maxScore = maxRiskScore !== undefined ? maxRiskScore : 100;
    const step = stepOrder !== undefined ? stepOrder : (required_level || 1);

    const created = await prisma.approvalRule.create({
      data: {
        name,
        minRiskScore: minScore,
        maxRiskScore: maxScore,
        requiredRole,
        stepOrder: step,
        active: true,
      },
    });

    sendSuccess(res, 201, 'Approval rule created', { rule: created, data: created });
  } catch (err) {
    next(err);
  }
});

// Update approval rule
router.put('/:id', authenticate, requireRole(['ADMIN', 'SALES_MANAGER', 'MANAGER_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, min_amount, max_amount, risk_threshold, required_level, active, is_active } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (risk_threshold !== undefined) data.minRiskScore = risk_threshold;
    if (required_level !== undefined) data.stepOrder = required_level;
    if (active !== undefined) data.active = active;
    if (is_active !== undefined) data.active = is_active;

    const updated = await prisma.approvalRule.update({
      where: { id },
      data,
    });

    sendSuccess(res, 200, 'Approval rule updated', { rule: updated, data: updated });
  } catch (err) {
    next(err);
  }
});

// Delete approval rule
router.delete('/:id', authenticate, requireRole(['ADMIN', 'SALES_MANAGER', 'MANAGER_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.approvalRule.delete({ where: { id } });
    sendSuccess(res, 200, 'Approval rule deleted', { id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
