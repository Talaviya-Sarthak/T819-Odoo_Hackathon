'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const operationsAnalyticsService = require('../analytics/operations-analytics.service');
const ordersService = require('../orders/orders.service');
const billingService = require('../billing/billing.service');
const { sendSuccess } = require('../../utils/response');

router.use(authenticate);
router.use(requireRole(['OPERATIONS', 'FINANCE', 'OPS_FINANCE', 'ADMIN', 'MANAGER_ADMIN', 'SALES_MANAGER']));

router.get('/dashboard', async (req, res, next) => {
  try {
    const kpis = await operationsAnalyticsService.getOperationsKPIs();
    const analytics = await operationsAnalyticsService.getOperationsAnalytics();
    sendSuccess(res, 200, 'Operations & Finance Dashboard', {
      user: { id: req.user.id, email: req.user.email, role: req.user.role },
      kpis,
      analytics,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const orders = await ordersService.listOrders(req.query);
    sendSuccess(res, 200, 'Operations confirmed orders', { orders });
  } catch (err) {
    next(err);
  }
});

router.get('/invoices', async (req, res, next) => {
  try {
    const invoices = await billingService.listInvoices(req.query);
    sendSuccess(res, 200, 'Invoices list', { invoices });
  } catch (err) {
    next(err);
  }
});

router.get('/payments', async (req, res, next) => {
  try {
    const payments = await billingService.listPayments(req.query);
    sendSuccess(res, 200, 'Payments status', { payments });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
