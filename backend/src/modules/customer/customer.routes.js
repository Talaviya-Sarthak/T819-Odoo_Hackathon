'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const quotationsService = require('../quotations/quotations.service');
const ordersService = require('../orders/orders.service');
const billingService = require('../billing/billing.service');
const billingController = require('../billing/billing.controller');
const { sendSuccess } = require('../../utils/response');

router.use(authenticate);
router.use(requireRole('CUSTOMER'));

router.get('/dashboard', async (req, res, next) => {
  try {
    const [quotations, orders, invoices] = await Promise.all([
      quotationsService.list({ user: req.user, limit: 5 }),
      ordersService.list({ user: req.user, limit: 5 }),
      billingService.listInvoices({ user: req.user, limit: 5 }),
    ]);

    sendSuccess(res, 200, 'Customer Portal Dashboard', {
      user: { id: req.user.id, email: req.user.email, role: req.user.role },
      quotations,
      orders,
      invoices,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/quotations', async (req, res, next) => {
  try {
    const quotations = await quotationsService.list({ ...req.query, user: req.user });
    sendSuccess(res, 200, 'Customer quotations', { quotations });
  } catch (err) {
    next(err);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const orders = await ordersService.list({ ...req.query, user: req.user });
    sendSuccess(res, 200, 'Customer orders', { orders });
  } catch (err) {
    next(err);
  }
});

router.get('/invoices', async (req, res, next) => {
  try {
    const invoices = await billingService.listInvoices({ ...req.query, user: req.user });
    sendSuccess(res, 200, 'Customer invoices', { invoices });
  } catch (err) {
    next(err);
  }
});

router.get('/invoices/:id', async (req, res, next) => {
  try {
    const invoice = await billingService.getInvoiceById(req.params.id, req.user);
    sendSuccess(res, 200, 'Invoice fetched', { invoice });
  } catch (err) {
    next(err);
  }
});

router.get('/invoices/:id/pdf', billingController.downloadInvoicePdf);
router.get('/invoices/:id/download', billingController.downloadInvoicePdf);

router.get('/payments', async (req, res, next) => {
  try {
    const payments = await billingService.listPayments({ ...req.query, user: req.user });
    sendSuccess(res, 200, 'Customer payments', { payments });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
