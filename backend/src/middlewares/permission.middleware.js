'use strict';

const { AppError } = require('../utils/errors');
const rbacService = require('../services/rbac.service');

/**
 * Middleware factory: restrict route to users with specific permission(s).
 * Must be used AFTER `authenticate` middleware.
 *
 * Usage:
 *   router.post('/approve', authenticate, requirePermission('approval.approve'), handler);
 *   router.get('/users', authenticate, requirePermission(['user.manage']), handler);
 */
function requirePermission(...requiredPermissions) {
  const flatPermissions = requiredPermissions.flat();

  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authentication required', 401));
      }

      const userPermissions = await rbacService.getPermissionsByRoleName(req.user.role);
      const hasPermission = flatPermissions.some(p => userPermissions.includes(p));

      if (!hasPermission) {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware factory: restrict route to users with ALL specified permissions.
 */
function requireAllPermissions(...requiredPermissions) {
  const flatPermissions = requiredPermissions.flat();

  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(new AppError('Authentication required', 401));
      }

      const userPermissions = await rbacService.getPermissionsByRoleName(req.user.role);
      const hasAll = flatPermissions.every(p => userPermissions.includes(p));

      if (!hasAll) {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requirePermission, requireAllPermissions };
