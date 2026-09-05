'use strict';

const express = require('express');
const router = express.Router();
const quotationsController = require('./quotations.controller');
const discountsController = require('../discounts/discounts.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/', authenticate, quotationsController.list);
router.get('/:id', authenticate, quotationsController.getById);
router.post('/', authenticate, quotationsController.create);
router.put('/:id', authenticate, quotationsController.update);
router.post('/:id/submit', authenticate, quotationsController.submit);
router.post('/:id/discount-check', authenticate, discountsController.checkDiscount);
router.post('/:id/confirm', authenticate, quotationsController.confirm);
router.post('/:id/customer-confirm', authenticate, quotationsController.confirm);

module.exports = router;
