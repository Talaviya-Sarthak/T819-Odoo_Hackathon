'use strict';

const reportsService = require('./reports.service');
const { sendSuccess } = require('../../utils/response');

exports.salesReport = async (req, res, next) => {
  try {
    const result = await reportsService.salesReport(req.query);
    sendSuccess(res, 200, 'Sales report fetched', { report: result });
  } catch (err) {
    next(err);
  }
};

exports.approvalReport = async (req, res, next) => {
  try {
    const result = await reportsService.approvalReport();
    sendSuccess(res, 200, 'Approval report fetched', { report: result });
  } catch (err) {
    next(err);
  }
};

exports.fulfillmentReport = async (req, res, next) => {
  try {
    const result = await reportsService.fulfillmentReport();
    sendSuccess(res, 200, 'Fulfillment report fetched', { report: result });
  } catch (err) {
    next(err);
  }
};

exports.billingReport = async (req, res, next) => {
  try {
    const result = await reportsService.billingReport();
    sendSuccess(res, 200, 'Billing report fetched', { report: result });
  } catch (err) {
    next(err);
  }
};
