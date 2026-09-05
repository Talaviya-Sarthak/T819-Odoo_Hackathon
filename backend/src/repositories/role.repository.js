'use strict';

const { query } = require('../database/index');
const { v4: uuidv4 } = require('uuid');

exports.findByName = async (name) => {
  const result = await query('SELECT * FROM roles WHERE name = $1', [name]);
  return result.rows?.[0] || null;
};

exports.findById = async (id) => {
  const result = await query('SELECT * FROM roles WHERE id = $1', [id]);
  return result.rows?.[0] || null;
};

exports.findAllActive = async () => {
  const result = await query(
    'SELECT id, name, display_name, description FROM roles WHERE is_active = true ORDER BY display_name'
  );
  return result.rows || [];
};

exports.findSelfRegisterable = async () => {
  const result = await query(
    'SELECT id, name, display_name, description FROM roles WHERE is_active = true AND is_self_registerable = true ORDER BY display_name'
  );
  return result.rows || [];
};

exports.findAll = async () => {
  const result = await query(
    'SELECT id, name, display_name, description, is_active, is_self_registerable, created_at, updated_at FROM roles ORDER BY display_name'
  );
  return result.rows || [];
};

exports.getPermissions = async (roleId) => {
  const result = await query(
    `SELECT p.id, p.name, p.display_name, p.description
     FROM permissions p
     INNER JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = $1 AND p.is_active = true
     ORDER BY p.name`,
    [roleId]
  );
  return result.rows || [];
};

exports.getPortal = async (roleId) => {
  const result = await query(
    `SELECT id, portal_name, portal_route
     FROM role_portals
     WHERE role_id = $1 AND is_active = true`,
    [roleId]
  );
  return result.rows?.[0] || null;
};

exports.getNavigation = async (roleId) => {
  const result = await query(
    `SELECT ni.id, ni.name, ni.display_name, ni.route, ni.icon, ni.sort_order
     FROM navigation_items ni
     INNER JOIN role_navigation rn ON rn.navigation_item_id = ni.id
     WHERE rn.role_id = $1 AND ni.is_active = true
     ORDER BY ni.sort_order`,
    [roleId]
  );
  return result.rows || [];
};

exports.getUserWithRole = async (userId) => {
  const result = await query(
    `SELECT u.*, r.name as role_name, r.display_name as role_display_name
     FROM users u
     LEFT JOIN roles r ON r.name = u.role::text
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows?.[0] || null;
};
