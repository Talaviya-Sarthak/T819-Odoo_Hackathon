'use strict';

const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

router.get('/', authenticate, productsController.list);
router.get('/:id', authenticate, productsController.getById);
router.post('/', authenticate, requireRole('ADMIN'), productsController.create);
router.put('/:id', authenticate, requireRole('ADMIN'), productsController.update);

module.exports = router;
