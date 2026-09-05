'use strict';

const { query } = require('../database/index');
const { v4: uuidv4 } = require('uuid');

exports.findByEmail = async (email) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows?.[0] || result[0] || null;
};

exports.findById = async (id) => {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows?.[0] || result[0] || null;
};

exports.findByCustomerId = async (customerId) => {
  const result = await query('SELECT * FROM users WHERE customer_id = $1', [customerId]);
  return result.rows?.[0] || result[0] || null;
};

exports.create = async (data) => {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO users (id, email, name, password_hash, avatar_url, email_verified, role, customer_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      id,
      data.email,
      data.name || null,
      data.passwordHash || data.password_hash || null,
      data.avatar_url || null,
      data.email_verified || false,
      data.role || 'CUSTOMER',
      data.customer_id || null,
      data.status || 'active',
    ]
  );
  return result.rows?.[0] || result[0];
};

exports.update = async (id, data) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const result = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows?.[0] || result[0];
};

exports.delete = async (id) => {
  return query('DELETE FROM users WHERE id = $1', [id]);
};

exports.findByRole = async (role) => {
  const result = await query('SELECT * FROM users WHERE role = $1', [role]);
  return result.rows || result || [];
};

exports.findAll = async () => {
  const result = await query('SELECT id, email, name, role, customer_id, status, avatar_url, email_verified, created_at, updated_at FROM users ORDER BY created_at DESC');
  return result.rows || result || [];
};

exports.updateStatus = async (id, status) => {
  return exports.update(id, { status });
};
