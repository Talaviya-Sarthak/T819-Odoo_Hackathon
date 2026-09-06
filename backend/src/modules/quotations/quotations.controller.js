'use strict';

const quotationsService = require('./quotations.service');
const { sendSuccess } = require('../../utils/response');

exports.list = async (req, res, next) => {
  try {
    const result = await quotationsService.list({ ...req.query, user: req.user });
    sendSuccess(res, 200, 'Quotations fetched', {
      quotations: result,
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
    const result = await quotationsService.getById(req.params.id, req.user);
    sendSuccess(res, 200, 'Quotation fetched', { quotation: result });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const result = await quotationsService.create(req.body, req.user);
    sendSuccess(res, 201, 'Quotation created', { quotation: result });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await quotationsService.update(req.params.id, req.body, req.user);
    sendSuccess(res, 200, 'Quotation updated', { quotation: result });
  } catch (err) {
    next(err);
  }
};

exports.submit = async (req, res, next) => {
  try {
    const result = await quotationsService.submit(req.params.id, req.user);
    sendSuccess(res, 200, 'Quotation submitted for approval', result);
  } catch (err) {
    next(err);
  }
};

exports.confirm = async (req, res, next) => {
  try {
    const result = await quotationsService.confirm(req.params.id, req.user);
    sendSuccess(res, 200, 'Quotation confirmed', { quotation: result });
  } catch (err) {
    next(err);
  }
};
