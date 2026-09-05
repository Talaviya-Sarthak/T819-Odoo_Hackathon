'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

router.use(authenticate);
router.use(requireRole('SALES_REP'));

router.get('/dashboard', (req, res) => {
  res.json({
    message: 'Sales Dashboard',
    user: { id: req.user.id, email: req.user.email, role: req.user.role },
  });
});

router.get('/quotations', (req, res) => {
  res.json({ message: 'Sales quotations list', quotations: [] });
});

router.get('/orders', (req, res) => {
  res.json({ message: 'Sales orders list', orders: [] });
});

module.exports = router;
