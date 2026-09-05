'use strict';

const express = require('express');
const router = express.Router();
const customersController = require('./customers.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

router.get('/tiers', authenticate, customersController.listTiers);

router.get('/', authenticate, customersController.list);
router.get('/:id', authenticate, customersController.getById);
router.post('/', authenticate, requireRole(['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'MANAGER_ADMIN']), customersController.create);
router.put('/:id', authenticate, customersController.update);

module.exports = router;
