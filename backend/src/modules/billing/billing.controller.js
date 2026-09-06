'use strict';

const billingService = require('./billing.service');
const { sendSuccess } = require('../../utils/response');

// ─── INVOICES ───────────────────────────────────────────────────────

exports.createInvoice = async (req, res, next) => {
  try {
    const { salesOrderId, scheduleId } = req.body;
    let result;
    if (salesOrderId) {
      result = await billingService.createInvoiceFromOrder(salesOrderId, req.user);
    } else if (scheduleId) {
      result = await billingService.createInvoiceFromSchedule(scheduleId, req.user);
    } else {
      throw new Error('Either salesOrderId or scheduleId is required to generate an invoice');
    }
    sendSuccess(res, 201, 'Invoice generated', { invoice: result });
  } catch (err) {
    next(err);
  }
};

exports.createInvoiceFromOrder = async (req, res, next) => {
  try {
    const orderId = req.params.orderId || req.body.salesOrderId;
    const result = await billingService.createInvoiceFromOrder(orderId, req.user);
    sendSuccess(res, 201, 'Invoice created from sales order', { invoice: result });
  } catch (err) {
    next(err);
  }
};

exports.createInvoiceFromSchedule = async (req, res, next) => {
  try {
    const scheduleId = req.params.scheduleId || req.body.scheduleId;
    const result = await billingService.createInvoiceFromSchedule(scheduleId, req.user);
    sendSuccess(res, 201, 'Invoice created from billing schedule', { invoice: result });
  } catch (err) {
    next(err);
  }
};

exports.listInvoices = async (req, res, next) => {
  try {
    const result = await billingService.listInvoices({ ...req.query, user: req.user });
    sendSuccess(res, 200, 'Invoices fetched', {
      invoices: result,
      pagination: result.pagination,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
};

exports.getInvoiceById = async (req, res, next) => {
  try {
    const result = await billingService.getInvoiceById(req.params.id, req.user);
    sendSuccess(res, 200, 'Invoice fetched', { invoice: result });
  } catch (err) {
    next(err);
  }
};

exports.downloadInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await billingService.getInvoiceById(req.params.id, req.user);
    const pdfBuffer = await billingService.generateInvoicePdf(req.params.id, req.user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber || 'Invoice'}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

exports.exportInvoicesCsv = async (req, res, next) => {
  try {
    const csvData = await billingService.exportInvoicesCsv({ ...req.query, user: req.user });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="DealFlow360-Invoices-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvData);
  } catch (err) {
    next(err);
  }
};

exports.exportInvoicesPdf = async (req, res, next) => {
  try {
    const pdfBuffer = await billingService.exportInvoicesPdf({ ...req.query, user: req.user });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DealFlow360-Invoices-Report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

// ─── PAYMENTS ───────────────────────────────────────────────────────

exports.recordPayment = async (req, res, next) => {
  try {
    const invoiceId = req.params.id || req.body.invoiceId;
    const result = await billingService.recordPayment({
      invoiceId,
      amount: req.body.amount,
      paymentMethod: req.body.paymentMethod || req.body.method,
      reference: req.body.reference,
    }, req.user);
    sendSuccess(res, 201, 'Payment recorded successfully', result);
  } catch (err) {
    next(err);
  }
};

exports.listPayments = async (req, res, next) => {
  try {
    const result = await billingService.listPayments({ ...req.query, user: req.user });
    sendSuccess(res, 200, 'Payments fetched', {
      payments: result,
      pagination: result.pagination,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentById = async (req, res, next) => {
  try {
    const result = await billingService.getPaymentById(req.params.id, req.user);
    sendSuccess(res, 200, 'Payment fetched', { payment: result });
  } catch (err) {
    next(err);
  }
};

// ─── SUBSCRIPTIONS ──────────────────────────────────────────────────

exports.getPlans = async (req, res, next) => {
  try {
    const result = await billingService.getPlans();
    sendSuccess(res, 200, 'Subscription plans fetched', { plans: result });
  } catch (err) {
    next(err);
  }
};

exports.listSubscriptions = async (req, res, next) => {
  try {
    const result = await billingService.listSubscriptions({ ...req.query, user: req.user });
    sendSuccess(res, 200, 'Subscriptions fetched', {
      subscriptions: result,
      pagination: result.pagination,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
};

exports.getSubscription = async (req, res, next) => {
  try {
    const result = await billingService.getSubscription(req.params.id, req.user);
    sendSuccess(res, 200, 'Subscription fetched', { subscription: result });
  } catch (err) {
    next(err);
  }
};

exports.getBillingSchedule = async (req, res, next) => {
  try {
    const result = await billingService.getBillingSchedule(req.params.id, req.user);
    sendSuccess(res, 200, 'Billing schedule fetched', { schedule: result });
  } catch (err) {
    next(err);
  }
};

exports.listBillingSchedules = async (req, res, next) => {
  try {
    const result = await billingService.listBillingSchedules({ ...req.query, user: req.user });
    sendSuccess(res, 200, 'Billing schedules fetched', { schedules: result });
  } catch (err) {
    next(err);
  }
};

exports.pauseSubscription = async (req, res, next) => {
  try {
    const result = await billingService.pauseSubscription(req.params.id, req.user);
    sendSuccess(res, 200, 'Subscription paused', { subscription: result });
  } catch (err) {
    next(err);
  }
};

exports.resumeSubscription = async (req, res, next) => {
  try {
    const result = await billingService.resumeSubscription(req.params.id, req.user);
    sendSuccess(res, 200, 'Subscription resumed', { subscription: result });
  } catch (err) {
    next(err);
  }
};

exports.cancelSubscription = async (req, res, next) => {
  try {
    const result = await billingService.cancelSubscription(req.params.id, req.user);
    sendSuccess(res, 200, 'Subscription cancelled', { subscription: result });
  } catch (err) {
    next(err);
  }
};
