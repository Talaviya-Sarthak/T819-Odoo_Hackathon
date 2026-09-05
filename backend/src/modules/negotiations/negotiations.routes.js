'use strict';

const express = require('express');
const router = express.Router();
const negotiationsController = require('./negotiations.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/quotations/:id/negotiation', authenticate, negotiationsController.getMessages);
router.post('/quotations/:id/negotiation/message', authenticate, negotiationsController.sendMessage);
router.post('/quotations/:id/negotiation/request-change', authenticate, negotiationsController.requestChange);

module.exports = router;
