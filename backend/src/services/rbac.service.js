'use strict';

const roleRepository = require('../repositories/role.repository');
const { AppError } = require('../utils/errors');

/**
 * Get all active roles available for self-registration.
 */
exports.getPublicRoles = async () => {
  return roleRepository.findAllActive();
};

/**
 * Get all active roles (admin use).
 */
exports.getAllRoles = async () => {
  return roleRepository.findAll();
};

/**
 * Validate that a role exists, is active, and is self-registerable.
 * Throws AppError if validation fails.
 */
exports.validateSelfRegisterableRole = async (roleIdentifier) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roleIdentifier);
  const role = isUuid
    ? await roleRepository.findById(roleIdentifier)
    : await roleRepository.findByName(roleIdentifier);
  if (!role) {
    throw new AppError('Invalid role selected', 400);
  }
  if (!role.is_active) {
    throw new AppError('Selected role is not currently active', 400);
  }
  return role;
};

/**
 * Validate that a role exists and is active (admin use).
 */
exports.validateActiveRole = async (roleId) => {
  const role = await roleRepository.findById(roleId);
  if (!role) {
    throw new AppError('Invalid role selected', 400);
  }
  if (!role.is_active) {
    throw new AppError('Selected role is not currently active', 400);
  }
  return role;
};

/**
 * Get the full authorization context for a user:
 * role, permissions, portal, navigation.
 */
exports.getUserAuthContext = async (userId) => {
  const userWithRole = await roleRepository.getUserWithRole(userId);
  if (!userWithRole) {
    throw new AppError('User not found', 404);
  }

  const roleId = userWithRole.role
    ? (await require('../repositories/user.repository').findByEmail(userWithRole.email))?.role
    : null;

  // Find the role record by name
  const role = await roleRepository.findByName(userWithRole.role);
  if (!role) {
    return {
      user: sanitizeUser(userWithRole),
      permissions: [],
      portal: null,
      navigation: [],
    };
  }

  const [permissions, portal, navigation] = await Promise.all([
    roleRepository.getPermissions(role.id),
    roleRepository.getPortal(role.id),
    roleRepository.getNavigation(role.id),
  ]);

  return {
    user: sanitizeUser(userWithRole),
    permissions: permissions.map(p => p.name),
    portal: portal ? { name: portal.portal_name, route: portal.portal_route } : null,
    navigation: navigation.map(n => ({
      id: n.id,
      name: n.name,
      label: n.display_name,
      path: n.route,
      icon: n.icon,
    })),
  };
};

/**
 * Check if a user has a specific permission.
 */
exports.userHasPermission = async (userId, permissionName) => {
  const user = await require('../repositories/user.repository').findById(userId);
  if (!user) return false;

  const role = await roleRepository.findByName(user.role);
  if (!role) return false;

  const permissions = await roleRepository.getPermissions(role.id);
  return permissions.some(p => p.name === permissionName);
};

/**
 * Get permissions for a user by their role name.
 */
exports.getPermissionsByRoleName = async (roleName) => {
  const role = await roleRepository.findByName(roleName);
  if (!role) return [];

  const permissions = await roleRepository.getPermissions(role.id);
  return permissions.map(p => p.name);
};

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    customer_id: user.customer_id,
    status: user.status,
    avatar_url: user.avatar_url,
  };
}
