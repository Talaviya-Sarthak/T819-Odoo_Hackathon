'use strict';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
const userRepository = require('../../repositories/user.repository');
const rbacService = require('../../services/rbac.service');
const { sendSuccess } = require('../../utils/response');
const { AppError } = require('../../utils/errors');

router.use(authenticate);
router.use(requireRole(['ADMIN', 'SALES_MANAGER', 'MANAGER_ADMIN']));

// GET /api/management/roles - all active roles (for admin dropdown)
router.get('/roles', async (req, res, next) => {
  try {
    const roles = await rbacService.getAllRoles();
    sendSuccess(res, 200, 'Roles fetched', { roles });
  } catch (err) {
    next(err);
  }
});

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
    const users = await userRepository.findAll(req.query);
    res.json({
      message: 'Users list',
      users,
      pagination: users.pagination,
      total: users.total,
      page: users.page,
      limit: users.limit,
      totalPages: users.totalPages,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/management/users - create a new user (admin only)
router.post('/users', requirePermission('user.manage'), async (req, res, next) => {
  try {
    const { name, email, password, roleId, customerId } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', 400);
    }

    if (!roleId) {
      throw new AppError('Role is required', 400);
    }

    // Validate the role exists and is active (database-driven)
    const role = await rbacService.validateActiveRole(roleId);

    // Check if email already exists
    const existing = await userRepository.findByEmail(email.toLowerCase().trim());
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userRepository.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      email_verified: true,
      role: role.name,
      customer_id: customerId || null,
    });

    sendSuccess(res, 201, 'User created successfully', {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        customer_id: user.customer_id,
        status: user.status,
      }
    });
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

// PUT /api/management/users/:id/role - database-driven role validation
router.put('/users/:id/role', requirePermission('user.manage'), async (req, res, next) => {
  try {
    const { roleId } = req.body;

    if (!roleId) {
      throw new AppError('Role ID is required', 400);
    }

    // Validate the role exists and is active in the database
    const role = await rbacService.validateActiveRole(roleId);

    // Prevent admin from demoting themselves
    if (req.params.id === req.user.id && role.name !== 'MANAGER_ADMIN') {
      throw new AppError('You cannot change your own admin role', 400);
    }

    const user = await userRepository.update(req.params.id, { role: role.name });
    res.json({ message: 'User role updated', user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
