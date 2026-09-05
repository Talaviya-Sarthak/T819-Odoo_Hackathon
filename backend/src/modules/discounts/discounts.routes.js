'use strict';

const express = require('express');
const router = express.Router();
const discountsController = require('./discounts.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.post('/quotations/:id/discount-check', authenticate, discountsController.checkDiscount);

module.exports = router;
