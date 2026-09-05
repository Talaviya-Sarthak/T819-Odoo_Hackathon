'use strict';

const { AppError } = require('../utils/errors');

/**
 * Middleware factory: restrict route to specific roles.
 * Must be used AFTER `authenticate` middleware.
 *
 * Usage:
 *   router.get('/path', authenticate, requireRole('MANAGER_ADMIN'), handler);
 *   router.get('/path', authenticate, requireRole(['MANAGER_ADMIN', 'SALES_REP']), handler);
 */
function requireRole(...allowedRoles) {
  const flatRoles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Authentication required', 401));
    }

    if (!flatRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to access this resource', 403));
    }

    next();
  };
}

module.exports = { requireRole };
