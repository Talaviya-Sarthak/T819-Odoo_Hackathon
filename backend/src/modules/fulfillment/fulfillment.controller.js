'use strict';

const fulfillmentService = require('./fulfillment.service');
const { sendSuccess } = require('../../utils/response');

exports.getFulfillment = async (req, res, next) => {
  try {
    const result = await fulfillmentService.getFulfillment(req.params.id);
    sendSuccess(res, 200, 'Fulfillment orders fetched', { fulfillmentOrders: result });
  } catch (err) {
    next(err);
  }
};

exports.allocate = async (req, res, next) => {
  try {
    const result = await fulfillmentService.allocate(req.params.id, req.body);
    sendSuccess(res, 201, 'Stock allocated', { fulfillmentOrder: result });
  } catch (err) {
    next(err);
  }
};

exports.override = async (req, res, next) => {
  try {
    const result = await fulfillmentService.override(req.params.id, req.body);
    sendSuccess(res, 201, 'Stock override allocation created', { fulfillmentOrder: result });
  } catch (err) {
    next(err);
  }
};
