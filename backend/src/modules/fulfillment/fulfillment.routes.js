'use strict';

const express = require('express');
const router = express.Router();
const fulfillmentController = require('./fulfillment.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/quotations/:id/fulfillment', authenticate, fulfillmentController.getFulfillment);
router.post('/quotations/:id/fulfillment/allocate', authenticate, fulfillmentController.allocate);
router.post('/quotations/:id/fulfillment/override', authenticate, fulfillmentController.override);

module.exports = router;
