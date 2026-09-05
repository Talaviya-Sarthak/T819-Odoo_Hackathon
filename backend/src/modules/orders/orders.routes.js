'use strict';

const express = require('express');
const router = express.Router();
const ordersController = require('./orders.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

const OPS_ROLES = ['ADMIN', 'MANAGER_ADMIN', 'OPS_FINANCE', 'OPERATIONS', 'FINANCE', 'SALES_MANAGER'];
const WRITE_ROLES = ['ADMIN', 'MANAGER_ADMIN', 'OPS_FINANCE', 'OPERATIONS', 'FINANCE', 'SALES_MANAGER', 'SALES_REP'];

router.get('/', authenticate, ordersController.list);
router.get('/:id', authenticate, ordersController.getById);
router.post(
  '/from-quotation/:quotationId',
  authenticate,
  requireRole([...WRITE_ROLES, 'CUSTOMER']),
  ordersController.createFromQuotation
);
router.post(
  '/:id/confirm',
  authenticate,
  requireRole(OPS_ROLES),
  ordersController.confirm
);
router.post(
  '/:id/cancel',
  authenticate,
  requireRole(OPS_ROLES),
  ordersController.cancel
);

module.exports = router;
