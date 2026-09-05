'use strict';

const express = require('express');
const router = express.Router();
const backordersController = require('./backorders.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

const READ_ROLES = ['ADMIN', 'MANAGER_ADMIN', 'OPS_FINANCE', 'OPERATIONS', 'FINANCE', 'SALES_MANAGER', 'SALES_REP'];
const WRITE_ROLES = ['ADMIN', 'MANAGER_ADMIN', 'OPS_FINANCE', 'OPERATIONS'];

router.get(
  '/',
  authenticate,
  requireRole(READ_ROLES),
  backordersController.list
);
router.get(
  '/:id',
  authenticate,
  requireRole(READ_ROLES),
  backordersController.getById
);
router.post(
  '/:id/fulfill',
  authenticate,
  requireRole(WRITE_ROLES),
  backordersController.fulfill
);

module.exports = router;
