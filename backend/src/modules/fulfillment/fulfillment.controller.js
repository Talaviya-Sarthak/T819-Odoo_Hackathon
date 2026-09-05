'use strict';

const fulfillmentService = require('./fulfillment.service');
const { sendSuccess } = require('../../utils/response');

exports.createFulfillment = async (req, res, next) => {
  try {
    const result = await fulfillmentService.createFulfillment(req.body, req.user);
    sendSuccess(res, 201, 'Fulfillment created', { fulfillment: result, fulfillmentOrder: result });
  } catch (err) {
    next(err);
  }
};

exports.fulfill = async (req, res, next) => {
  try {
    const result = await fulfillmentService.fulfill(req.params.id, req.body, req.user);
    sendSuccess(res, 200, 'Fulfillment order processed', { fulfillment: result, fulfillmentOrder: result });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const result = await fulfillmentService.list(req.query);
    sendSuccess(res, 200, 'Fulfillments fetched', { fulfillments: result, fulfillmentOrders: result });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await fulfillmentService.getById(req.params.id);
    sendSuccess(res, 200, 'Fulfillment order fetched', { fulfillment: result, fulfillmentOrder: result });
  } catch (err) {
    next(err);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const result = await fulfillmentService.cancel(req.params.id, req.user, req.body?.reason);
    sendSuccess(res, 200, 'Fulfillment order cancelled', { fulfillment: result });
  } catch (err) {
    next(err);
  }
};

// Legacy compatibility endpoints
exports.getFulfillment = async (req, res, next) => {
  try {
    const results = await fulfillmentService.list({ salesOrderId: req.params.id });
    sendSuccess(res, 200, 'Fulfillments fetched', { fulfillments: results });
  } catch (err) {
    next(err);
  }
};

exports.allocate = async (req, res, next) => {
  try {
    const result = await fulfillmentService.createFulfillment({
      salesOrderId: req.params.id,
      warehouseId: req.body.warehouseId,
      notes: req.body.reason,
    }, req.user);
    sendSuccess(res, 200, 'Stock allocated', { fulfillment: result });
  } catch (err) {
    next(err);
  }
};

exports.override = async (req, res, next) => {
  try {
    const result = await fulfillmentService.createFulfillment({
      salesOrderId: req.params.id,
      warehouseId: req.body.warehouseId,
      notes: req.body.reason,
    }, req.user);
    sendSuccess(res, 200, 'Allocation override recorded', { fulfillment: result });
  } catch (err) {
    next(err);
  }
};
