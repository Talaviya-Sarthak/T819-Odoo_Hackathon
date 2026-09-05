'use strict';

const express = require('express');
const router = express.Router();
const customersController = require('./customers.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/', authenticate, customersController.list);
router.get('/:id', authenticate, customersController.getById);
router.post('/', authenticate, customersController.create);
router.put('/:id', authenticate, customersController.update);

module.exports = router;
