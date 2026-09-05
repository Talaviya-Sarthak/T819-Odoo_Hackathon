'use strict';

const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/reports/sales', authenticate, reportsController.salesReport);
router.get('/reports/approvals', authenticate, reportsController.approvalReport);
router.get('/reports/fulfillment', authenticate, reportsController.fulfillmentReport);
router.get('/reports/billing', authenticate, reportsController.billingReport);

module.exports = router;
