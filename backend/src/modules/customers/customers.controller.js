'use strict';

const customersService = require('./customers.service');
const { sendSuccess } = require('../../utils/response');

exports.list = async (req, res, next) => {
  try {
    const result = await customersService.list({ ...req.query, user: req.user });
    sendSuccess(res, 200, 'Customers fetched', { customers: result });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await customersService.getById(req.params.id, req.user);
    sendSuccess(res, 200, 'Customer fetched', { customer: result });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const result = await customersService.create(req.body, req.user);
    sendSuccess(res, 201, 'Customer created', { customer: result });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await customersService.update(req.params.id, req.body, req.user);
    sendSuccess(res, 200, 'Customer updated', { customer: result });
  } catch (err) {
    next(err);
  }
};

exports.listTiers = async (req, res, next) => {
  try {
    const result = await customersService.listTiers();
    sendSuccess(res, 200, 'Customer tiers fetched', { tiers: result });
  } catch (err) {
    next(err);
  }
};
