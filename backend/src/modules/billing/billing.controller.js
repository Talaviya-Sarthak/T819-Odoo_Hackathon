'use strict';

const billingService = require('./billing.service');
const { sendSuccess } = require('../../utils/response');

exports.getQuotationBilling = async (req, res, next) => {
  try {
    const result = await billingService.getQuotationBilling(req.params.id);
    sendSuccess(res, 200, 'Billing info fetched', { billing: result });
  } catch (err) {
    next(err);
  }
};

exports.getSubscription = async (req, res, next) => {
  try {
    const result = await billingService.getSubscription(req.params.id);
    sendSuccess(res, 200, 'Subscription fetched', { subscription: result });
  } catch (err) {
    next(err);
  }
};

exports.getBillingSchedule = async (req, res, next) => {
  try {
    const result = await billingService.getBillingSchedule(req.params.id);
    sendSuccess(res, 200, 'Billing schedule fetched', { schedule: result });
  } catch (err) {
    next(err);
  }
};

exports.createSubscription = async (req, res, next) => {
  try {
    const result = await billingService.createSubscription(req.body);
    sendSuccess(res, 201, 'Subscription created', { subscription: result });
  } catch (err) {
    next(err);
  }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const result = await billingService.createInvoice(req.body);
    sendSuccess(res, 201, 'Invoice created', { invoice: result });
  } catch (err) {
    next(err);
  }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const result = await billingService.recordPayment(req.body);
    sendSuccess(res, 201, 'Payment recorded', { payment: result });
  } catch (err) {
    next(err);
  }
};
