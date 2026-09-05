'use strict';

const warehousesService = require('./warehouses.service');
const { sendSuccess } = require('../../utils/response');

exports.list = async (req, res, next) => {
  try {
    const result = await warehousesService.list();
    sendSuccess(res, 200, 'Warehouses fetched', { warehouses: result });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await warehousesService.getById(req.params.id);
    sendSuccess(res, 200, 'Warehouse fetched', { warehouse: result });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const result = await warehousesService.create(req.body, req.user);
    sendSuccess(res, 201, 'Warehouse created', { warehouse: result });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await warehousesService.update(req.params.id, req.body, req.user);
    sendSuccess(res, 200, 'Warehouse updated', { warehouse: result });
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const result = await warehousesService.delete(req.params.id, req.user);
    sendSuccess(res, 200, 'Warehouse deactivated', { warehouse: result });
  } catch (err) {
    next(err);
  }
};
