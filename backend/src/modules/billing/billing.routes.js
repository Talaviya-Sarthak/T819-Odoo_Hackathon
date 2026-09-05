'use strict';

const express = require('express');
const router = express.Router();
const billingController = require('./billing.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/quotations/:id/billing', authenticate, billingController.getQuotationBilling);
router.get('/subscriptions/:id', authenticate, billingController.getSubscription);
router.get('/subscriptions/:id/schedule', authenticate, billingController.getBillingSchedule);
router.post('/subscriptions', authenticate, billingController.createSubscription);
router.post('/invoices', authenticate, billingController.createInvoice);
router.post('/payments', authenticate, billingController.recordPayment);

module.exports = router;
