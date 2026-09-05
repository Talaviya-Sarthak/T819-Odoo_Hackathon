'use strict';

const express = require('express');
const router = express.Router();
const billingController = require('./billing.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

const READ_ROLES = ['ADMIN', 'MANAGER_ADMIN', 'OPS_FINANCE', 'OPERATIONS', 'FINANCE', 'SALES_MANAGER', 'SALES_REP'];
const WRITE_ROLES = ['ADMIN', 'MANAGER_ADMIN', 'OPS_FINANCE', 'FINANCE', 'OPERATIONS'];

// Invoices
router.get('/invoices', authenticate, billingController.listInvoices);
router.get('/invoices/:id', authenticate, billingController.getInvoiceById);
router.post(
  '/invoices',
  authenticate,
  requireRole(WRITE_ROLES),
  billingController.createInvoice
);
router.post(
  '/invoices/from-order/:orderId',
  authenticate,
  requireRole(WRITE_ROLES),
  billingController.createInvoiceFromOrder
);
router.post(
  '/invoices/from-schedule/:scheduleId',
  authenticate,
  requireRole(WRITE_ROLES),
  billingController.createInvoiceFromSchedule
);
router.post(
  '/invoices/:id/payments',
  authenticate,
  requireRole(WRITE_ROLES),
  billingController.recordPayment
);

// Payments
router.get('/payments', authenticate, billingController.listPayments);
router.get('/payments/:id', authenticate, billingController.getPaymentById);
router.post(
  '/payments',
  authenticate,
  requireRole(WRITE_ROLES),
  billingController.recordPayment
);

// Subscriptions & Schedules
router.get('/subscription-plans', authenticate, billingController.getPlans);
router.get('/subscriptions/plans', authenticate, billingController.getPlans);
router.get('/subscriptions', authenticate, billingController.listSubscriptions);
router.get('/subscriptions/:id', authenticate, billingController.getSubscription);
router.get('/subscriptions/:id/schedule', authenticate, billingController.getBillingSchedule);
router.get('/billing-schedules', authenticate, billingController.listBillingSchedules);
router.get('/schedules', authenticate, billingController.listBillingSchedules);
router.post(
  '/schedules/:scheduleId/invoice',
  authenticate,
  requireRole(WRITE_ROLES),
  billingController.createInvoiceFromSchedule
);
router.post(
  '/billing-schedules/:scheduleId/invoice',
  authenticate,
  requireRole(WRITE_ROLES),
  billingController.createInvoiceFromSchedule
);
router.post(
  '/subscriptions/:id/pause',
  authenticate,
  requireRole([...WRITE_ROLES, 'SALES_MANAGER']),
  billingController.pauseSubscription
);
router.post(
  '/subscriptions/:id/resume',
  authenticate,
  requireRole([...WRITE_ROLES, 'SALES_MANAGER']),
  billingController.resumeSubscription
);
router.post(
  '/subscriptions/:id/cancel',
  authenticate,
  requireRole([...WRITE_ROLES, 'SALES_MANAGER']),
  billingController.cancelSubscription
);

module.exports = router;
