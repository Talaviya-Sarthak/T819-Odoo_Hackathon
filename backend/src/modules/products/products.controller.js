'use strict';

const productsService = require('./products.service');
const { sendSuccess } = require('../../utils/response');

exports.list = async (req, res, next) => {
  try {
    const result = await productsService.list(req.query);
    sendSuccess(res, 200, 'Products fetched', { products: result });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const result = await productsService.getById(req.params.id);
    sendSuccess(res, 200, 'Product fetched', { product: result });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const result = await productsService.create(req.body, req.user);
    sendSuccess(res, 201, 'Product created', { product: result });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await productsService.update(req.params.id, req.body, req.user);
    sendSuccess(res, 200, 'Product updated', { product: result });
  } catch (err) {
    next(err);
  }
};

exports.listCategories = async (req, res, next) => {
  try {
    const result = await productsService.listCategories();
    sendSuccess(res, 200, 'Categories fetched', { categories: result });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const result = await productsService.createCategory(req.body, req.user);
    sendSuccess(res, 201, 'Category created', { category: result });
  } catch (err) {
    next(err);
  }
};
