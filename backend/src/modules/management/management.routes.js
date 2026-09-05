'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const userRepository = require('../../repositories/user.repository');

router.use(authenticate);
router.use(requireRole('MANAGER_ADMIN'));

router.get('/dashboard', (req, res) => {
  res.json({
    message: 'Management Dashboard',
    user: { id: req.user.id, email: req.user.email, role: req.user.role },
  });
});

router.get('/approvals', (req, res) => {
  res.json({ message: 'Pending approvals', approvals: [] });
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await userRepository.findAll();
    res.json({ message: 'Users list', users });
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const user = await userRepository.updateStatus(req.params.id, status);
    res.json({ message: 'User status updated', user });
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['SALES_REP', 'MANAGER_ADMIN', 'OPS_FINANCE', 'CUSTOMER'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await userRepository.update(req.params.id, { role });
    res.json({ message: 'User role updated', user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
