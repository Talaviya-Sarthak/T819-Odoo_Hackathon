'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

router.use(authenticate);
router.use(requireRole('CUSTOMER'));

router.get('/dashboard', (req, res) => {
  res.json({
    message: 'Customer Portal Dashboard',
    user: { id: req.user.id, email: req.user.email, role: req.user.role, customer_id: req.user.customer_id },
  });
});

router.get('/quotations', (req, res) => {
  res.json({ message: 'Customer quotations', quotations: [], customerId: req.user.customer_id });
});

router.get('/orders', (req, res) => {
  res.json({ message: 'Customer orders', orders: [], customerId: req.user.customer_id });
});

router.get('/invoices', (req, res) => {
  res.json({ message: 'Customer invoices', invoices: [], customerId: req.user.customer_id });
});

router.get('/payments', (req, res) => {
  res.json({ message: 'Customer payments', payments: [], customerId: req.user.customer_id });
});

module.exports = router;
