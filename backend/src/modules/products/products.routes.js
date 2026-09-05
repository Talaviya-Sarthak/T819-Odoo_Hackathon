'use strict';

const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

router.get('/categories', authenticate, productsController.listCategories);
router.post('/categories', authenticate, requireRole(['ADMIN', 'SALES_MANAGER', 'MANAGER_ADMIN']), productsController.createCategory);

router.get('/', authenticate, productsController.list);
router.get('/:id', authenticate, productsController.getById);
router.post('/', authenticate, requireRole(['ADMIN', 'SALES_MANAGER', 'OPERATIONS', 'MANAGER_ADMIN']), productsController.create);
router.put('/:id', authenticate, requireRole(['ADMIN', 'SALES_MANAGER', 'OPERATIONS', 'MANAGER_ADMIN']), productsController.update);

module.exports = router;
