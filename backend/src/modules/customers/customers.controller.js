'use strict';

const customersService = require('./customers.service');
const { sendSuccess } = require('../../utils/response');

exports.list = async (req, res, next) => {
  try {
    const result = await customersService.list(req.query);
    sendSuccess(res, 200, 'Customers fetched', { customers: result });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await customersService.getById(req.params.id);
    sendSuccess(res, 200, 'Customer fetched', { customer: result });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const result = await customersService.create(req.body);
    sendSuccess(res, 201, 'Customer created', { customer: result });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await customersService.update(req.params.id, req.body);
    sendSuccess(res, 200, 'Customer updated', { customer: result });
  } catch (err) {
    next(err);
  }
};
