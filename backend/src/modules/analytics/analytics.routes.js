'use strict';

const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

router.use(authenticate);
router.use(requireRole(['OPS_FINANCE', 'ADMIN', 'MANAGER_ADMIN', 'SALES_MANAGER']));

router.get('/operations/kpis', analyticsController.getOperationsKPIs);
router.get('/operations', analyticsController.getOperationsAnalytics);
router.get('/inventory', analyticsController.getInventoryAnalytics);
router.get('/billing', analyticsController.getBillingAnalytics);
router.get('/revenue', analyticsController.getRevenueAnalytics);

module.exports = router;
