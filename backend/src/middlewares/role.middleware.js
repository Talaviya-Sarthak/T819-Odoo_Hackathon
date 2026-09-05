'use strict';

const { AppError } = require('../utils/errors');
const roleRepository = require('../repositories/role.repository');

/**
 * Middleware factory: restrict route to specific roles.
 * Must be used AFTER `authenticate` middleware.
 *
 * Validates roles against the database to ensure they exist and are active.
 *
 * Usage:
 *   router.get('/path', authenticate, requireRole('MANAGER_ADMIN'), handler);
 *   router.get('/path', authenticate, requireRole(['MANAGER_ADMIN', 'SALES_REP']), handler);
 */
function requireRole(...allowedRoles) {
  const flatRoles = allowedRoles.flat();

  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return next(new AppError('Authentication required', 401));
      }

      if (!flatRoles.includes(req.user.role)) {
        return next(new AppError('You do not have permission to access this resource', 403));
      }

      // Validate the role exists and is active in the database
      const role = await roleRepository.findByName(req.user.role);
      if (!role || !role.is_active) {
        return next(new AppError('Your role is not active. Contact administrator.', 403));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireRole };
