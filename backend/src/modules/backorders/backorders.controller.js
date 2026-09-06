'use strict';

const backordersService = require('./backorders.service');
const { sendSuccess } = require('../../utils/response');

exports.list = async (req, res, next) => {
  try {
    const result = await backordersService.list(req.query);
    sendSuccess(res, 200, 'Backorders fetched', {
      backorders: result,
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
    const result = await backordersService.getById(req.params.id);
    sendSuccess(res, 200, 'Backorder fetched', { backorder: result });
  } catch (err) {
    next(err);
  }
};

exports.fulfill = async (req, res, next) => {
  try {
    const result = await backordersService.fulfill(req.params.id, req.body, req.user);
    sendSuccess(res, 200, 'Backorder fulfilled', { backorder: result });
  } catch (err) {
    next(err);
  }
};
