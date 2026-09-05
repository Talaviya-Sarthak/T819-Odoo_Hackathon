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

exports.create = async (data) => {
  const id = uuidv4();
  const result = await query(
    'INSERT INTO users (id, email, name, password_hash, avatar_url, email_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [id, data.email, data.name || null, data.passwordHash || data.password_hash || null, data.avatar_url || null, data.email_verified || false]
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
