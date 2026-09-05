'use strict';

const express = require('express');
const router = express.Router();
const recommendationsController = require('./recommendations.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/quotations/:id/recommendations', authenticate, recommendationsController.getRecommendations);
router.post('/recommendations/:id/add', authenticate, recommendationsController.addToQuotation);
router.post('/recommendations/:id/accept', authenticate, recommendationsController.addToQuotation);
router.post('/recommendations/:id/dismiss', authenticate, recommendationsController.dismiss);

module.exports = router;
