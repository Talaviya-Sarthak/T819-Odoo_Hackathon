'use strict';

const express = require('express');
const router = express.Router();
const inventoryController = require('./inventory.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

const READ_ROLES = ['ADMIN', 'MANAGER_ADMIN', 'OPS_FINANCE', 'OPERATIONS', 'FINANCE', 'SALES_MANAGER', 'SALES_REP'];
const WRITE_ROLES = ['ADMIN', 'MANAGER_ADMIN', 'OPS_FINANCE', 'OPERATIONS'];

router.get('/', authenticate, requireRole(READ_ROLES), inventoryController.list);
router.get('/:id', authenticate, requireRole(READ_ROLES), inventoryController.getById);
router.get('/warehouse/:warehouseId', authenticate, requireRole(READ_ROLES), inventoryController.getByWarehouse);
router.post('/:id/adjust', authenticate, requireRole(WRITE_ROLES), inventoryController.adjust);
router.post('/reserve', authenticate, requireRole(WRITE_ROLES), inventoryController.reserve);
router.post('/release', authenticate, requireRole(WRITE_ROLES), inventoryController.release);

module.exports = router;
