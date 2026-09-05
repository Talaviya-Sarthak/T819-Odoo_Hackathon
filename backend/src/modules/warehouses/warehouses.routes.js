'use strict';

const express = require('express');
const router = express.Router();
const warehousesController = require('./warehouses.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

const READ_ROLES = ['ADMIN', 'MANAGER_ADMIN', 'OPS_FINANCE', 'OPERATIONS', 'FINANCE', 'SALES_MANAGER', 'SALES_REP'];
const WRITE_ROLES = ['ADMIN', 'MANAGER_ADMIN', 'OPS_FINANCE', 'OPERATIONS'];

router.get('/', authenticate, requireRole(READ_ROLES), warehousesController.list);
router.get('/:id', authenticate, requireRole(READ_ROLES), warehousesController.getById);
router.post('/', authenticate, requireRole(WRITE_ROLES), warehousesController.create);
router.put('/:id', authenticate, requireRole(WRITE_ROLES), warehousesController.update);
router.delete('/:id', authenticate, requireRole(WRITE_ROLES), warehousesController.delete);

module.exports = router;
