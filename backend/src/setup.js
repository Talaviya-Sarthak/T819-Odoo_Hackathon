'use strict';

/**
 * Setup script: creates tables + seeds demo users + RBAC data.
 * Run: node src/setup.js
 */

require('dotenv').config();
const { connect, query, close } = require('./database/index');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('SALES_REP','MANAGER_ADMIN','OPS_FINANCE','CUSTOMER')),
  customer_id VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
`;

const DEMO_USERS = [];

async function setup() {
  console.log('Connecting to database...');
  await connect();

  // Create base tables
  console.log('Creating base tables...');
  await query(SCHEMA);
  console.log('  Base tables created.');

  // Run RBAC migration
  console.log('Running RBAC migration...');
  const migrationPath = path.join(__dirname, '../migrations/002_rbac_tables.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  await query(migrationSQL);
  console.log('  RBAC tables created and seeded.');

  // Seed demo users
  const passwordHash = await bcrypt.hash('demo1234', 12);

  for (const user of DEMO_USERS) {
    try {
      const existing = await query('SELECT id FROM users WHERE email = $1', [user.email]);
      if (existing.rows.length > 0) {
        await query(
          'UPDATE users SET role = $1, customer_id = $2, status = $3, updated_at = NOW() WHERE email = $4',
          [user.role, user.customer_id, 'active', user.email]
        );
        console.log(`  Updated: ${user.email} -> ${user.role}`);
      } else {
        await query(
          `INSERT INTO users (id, email, name, password_hash, role, customer_id, email_verified, status)
           VALUES ($1, $2, $3, $4, $5, $6, true, 'active')`,
          [uuidv4(), user.email, user.name, passwordHash, user.role, user.customer_id]
        );
        console.log(`  Created: ${user.email} -> ${user.role}`);
      }
    } catch (err) {
      console.error(`  Error with ${user.email}:`, err.message);
    }
  }

  console.log('\nSetup complete!');
  console.log('\nDemo Credentials (password: demo1234):');
  console.log('  SALES_REP:      sales@dealflow.demo');
  console.log('  MANAGER_ADMIN:  manager@dealflow.demo');
  console.log('  OPS_FINANCE:    ops@dealflow.demo');
  console.log('  CUSTOMER:       customer@dealflow.demo');

  await close();
  process.exit(0);
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
