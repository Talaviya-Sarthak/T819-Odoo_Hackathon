'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

router.use(authenticate);
router.use(requireRole('OPS_FINANCE'));

router.get('/dashboard', (req, res) => {
  res.json({
    message: 'Operations & Finance Dashboard',
    user: { id: req.user.id, email: req.user.email, role: req.user.role },
  });
});

router.get('/orders', (req, res) => {
  res.json({ message: 'Confirmed orders', orders: [] });
});

router.get('/invoices', (req, res) => {
  res.json({ message: 'Invoices list', invoices: [] });
});

router.get('/payments', (req, res) => {
  res.json({ message: 'Payments status', payments: [] });
});

module.exports = router;
