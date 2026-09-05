'use strict';

const express = require('express');
const router = express.Router();
const approvalsController = require('./approvals.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/', authenticate, approvalsController.list);
router.get('/:id', authenticate, approvalsController.getById);
router.post('/:id/approve', authenticate, approvalsController.approve);
router.post('/:id/reject', authenticate, approvalsController.reject);
router.post('/:id/return', authenticate, approvalsController.returnForRevision);

module.exports = router;
