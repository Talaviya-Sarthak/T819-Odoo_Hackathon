'use strict';

const operationsAnalyticsService = require('./operations-analytics.service');
const { sendSuccess } = require('../../utils/response');

exports.getOperationsKPIs = async (req, res, next) => {
  try {
    const data = await operationsAnalyticsService.getOperationsKPIs();
    sendSuccess(res, 200, 'Operations KPIs retrieved', data);
  } catch (err) {
    next(err);
  }
};

exports.getOperationsAnalytics = async (req, res, next) => {
  try {
    const data = await operationsAnalyticsService.getOperationsAnalytics();
    sendSuccess(res, 200, 'Operations analytics retrieved', data);
  } catch (err) {
    next(err);
  }
};

exports.getInventoryAnalytics = async (req, res, next) => {
  try {
    const data = await operationsAnalyticsService.getInventoryAnalytics();
    sendSuccess(res, 200, 'Inventory analytics retrieved', data);
  } catch (err) {
    next(err);
  }
};

exports.getBillingAnalytics = async (req, res, next) => {
  try {
    const data = await operationsAnalyticsService.getBillingAnalytics();
    sendSuccess(res, 200, 'Billing analytics retrieved', data);
  } catch (err) {
    next(err);
  }
};

exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const data = await operationsAnalyticsService.getRevenueAnalytics();
    sendSuccess(res, 200, 'Revenue analytics retrieved', data);
  } catch (err) {
    next(err);
  }
};
