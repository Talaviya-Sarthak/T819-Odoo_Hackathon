'use strict';

const ordersService = require('./orders.service');
const { sendSuccess } = require('../../utils/response');

exports.createFromQuotation = async (req, res, next) => {
  try {
    const result = await ordersService.createFromQuotation(req.params.quotationId, req.user);
    sendSuccess(res, 201, 'Sales order created from quotation', { order: result, salesOrder: result });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const result = await ordersService.list({ ...req.query, user: req.user });
    sendSuccess(res, 200, 'Sales orders fetched', {
      orders: result,
      salesOrders: result,
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

exports.getById = async (req, res, next) => {
  try {
    const result = await ordersService.getById(req.params.id, req.user);
    sendSuccess(res, 200, 'Sales order fetched', { order: result, salesOrder: result });
  } catch (err) {
    next(err);
  }
};

exports.confirm = async (req, res, next) => {
  try {
    const result = await ordersService.confirm(req.params.id, req.user);
    sendSuccess(res, 200, 'Sales order confirmed', { order: result, salesOrder: result });
  } catch (err) {
    next(err);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const result = await ordersService.cancel(req.params.id, req.user, req.body?.reason);
    sendSuccess(res, 200, 'Sales order cancelled', { order: result, salesOrder: result });
  } catch (err) {
    next(err);
  }
};
