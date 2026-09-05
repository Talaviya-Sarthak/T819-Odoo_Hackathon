'use strict';

const express = require('express');
const router = express.Router();
const fulfillmentController = require('./fulfillment.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

const READ_ROLES = ['ADMIN', 'MANAGER_ADMIN', 'OPS_FINANCE', 'OPERATIONS', 'FINANCE', 'SALES_MANAGER', 'SALES_REP'];
const WRITE_ROLES = ['ADMIN', 'MANAGER_ADMIN', 'OPS_FINANCE', 'OPERATIONS'];

// Core fulfillment endpoints
router.get('/', authenticate, requireRole(READ_ROLES), fulfillmentController.list);
router.post('/', authenticate, requireRole(WRITE_ROLES), fulfillmentController.createFulfillment);
router.get('/:id', authenticate, requireRole(READ_ROLES), fulfillmentController.getById);
router.post('/:id/fulfill', authenticate, requireRole(WRITE_ROLES), fulfillmentController.fulfill);
router.post('/:id/cancel', authenticate, requireRole(WRITE_ROLES), fulfillmentController.cancel);

router.get(
  '/fulfillments',
  authenticate,
  requireRole(READ_ROLES),
  fulfillmentController.list
);
router.get(
  '/fulfillments/:id',
  authenticate,
  requireRole(READ_ROLES),
  fulfillmentController.getById
);
router.post(
  '/fulfillments',
  authenticate,
  requireRole(WRITE_ROLES),
  fulfillmentController.createFulfillment
);
router.post(
  '/fulfillments/:id/fulfill',
  authenticate,
  requireRole(WRITE_ROLES),
  fulfillmentController.fulfill
);
router.post(
  '/fulfillments/:id/cancel',
  authenticate,
  requireRole(WRITE_ROLES),
  fulfillmentController.cancel
);

// Backward-compatible quotation-based routes
router.get('/quotations/:id/fulfillment', authenticate, fulfillmentController.getFulfillment);
router.post('/quotations/:id/fulfillment/allocate', authenticate, fulfillmentController.allocate);
router.post('/quotations/:id/fulfillment/override', authenticate, fulfillmentController.override);

module.exports = router;
