'use strict';

const express = require('express');
const router = express.Router();
const dealHealthController = require('./deal-health.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/dashboard/deal-health', authenticate, dealHealthController.getDealHealthSummary);
router.get('/dashboard/alerts', authenticate, dealHealthController.getAlerts);
router.get('/deal-health', authenticate, dealHealthController.getDealHealthSummary);
router.get('/alerts', authenticate, dealHealthController.getAlerts);

module.exports = router;
