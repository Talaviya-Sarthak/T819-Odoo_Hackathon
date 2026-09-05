'use strict';

const config = require('../config/env');

let pool = null;
let client = null;

async function connect() {
  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and configure your database connection.');
  }
  const { Pool } = require('pg');
  pool = new Pool({ connectionString: config.DATABASE_URL });
  await pool.query('SELECT 1');
}

async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

async function close() {
  if (pool) await pool.end();
}

module.exports = { connect, query, close };
