'use strict';

const inventoryService = require('./inventory.service');
const { sendSuccess } = require('../../utils/response');

exports.list = async (req, res, next) => {
  try {
    const result = await inventoryService.list(req.query);
    sendSuccess(res, 200, 'Inventory fetched', { inventory: result, stocks: result });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await inventoryService.getById(req.params.id);
    sendSuccess(res, 200, 'Stock item fetched', { stock: result });
  } catch (err) {
    next(err);
  }
};

exports.getByWarehouse = async (req, res, next) => {
  try {
    const result = await inventoryService.getByWarehouse(req.params.warehouseId);
    sendSuccess(res, 200, 'Warehouse inventory fetched', { inventory: result });
  } catch (err) {
    next(err);
  }
};

exports.adjust = async (req, res, next) => {
  try {
    const result = await inventoryService.adjust(req.params.id, req.body, req.user);
    sendSuccess(res, 200, 'Inventory adjusted successfully', { stock: result });
  } catch (err) {
    next(err);
  }
};

exports.reserve = async (req, res, next) => {
  try {
    const result = await inventoryService.reserve(req.body, req.user);
    sendSuccess(res, 200, 'Stock reserved', { stock: result });
  } catch (err) {
    next(err);
  }
};

exports.release = async (req, res, next) => {
  try {
    const result = await inventoryService.release(req.body, req.user);
    sendSuccess(res, 200, 'Stock released', { stock: result });
  } catch (err) {
    next(err);
  }
};
