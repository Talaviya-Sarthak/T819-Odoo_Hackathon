'use strict';

/**
 * Seed demo users for RBAC testing.
 * Run: node src/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, connect, close } = require('./database/index');

const DEMO_USERS = [
  {
    email: 'sales@dealflow.demo',
    name: 'Sales Rep Demo',
    role: 'SALES_REP',
    password: 'demo1234',
    customer_id: null,
  },
  {
    email: 'manager@dealflow.demo',
    name: 'Manager Admin Demo',
    role: 'MANAGER_ADMIN',
    password: 'demo1234',
    customer_id: null,
  },
  {
    email: 'ops@dealflow.demo',
    name: 'Ops Finance Demo',
    role: 'OPS_FINANCE',
    password: 'demo1234',
    customer_id: null,
  },
  {
    email: 'customer@dealflow.demo',
    name: 'Customer Demo',
    role: 'CUSTOMER',
    password: 'demo1234',
    customer_id: 'CUST-001',
  },
];

async function seed() {
  console.log('Connecting to database...');
  await connect();

  const passwordHash = await bcrypt.hash('demo1234', 12);

  for (const user of DEMO_USERS) {
    try {
      // Check if user already exists
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
      if (existing.rows.length > 0) {
        // Update role if user exists
        await pool.query(
          'UPDATE users SET role = $1, customer_id = $2, status = $3, updated_at = NOW() WHERE email = $4',
          [user.role, user.customer_id, 'active', user.email]
        );
        console.log(`  Updated: ${user.email} -> ${user.role}`);
      } else {
        await pool.query(
          `INSERT INTO users (email, name, password_hash, role, customer_id, email_verified, status)
           VALUES ($1, $2, $3, $4, $5, true, 'active')`,
          [user.email, user.name, passwordHash, user.role, user.customer_id]
        );
        console.log(`  Created: ${user.email} -> ${user.role}`);
      }
    } catch (err) {
      console.error(`  Error with ${user.email}:`, err.message);
    }
  }

  console.log('\nDemo users seeded successfully!');
  console.log('\nDemo Credentials:');
  console.log('  SALES_REP:      sales@dealflow.demo / demo1234');
  console.log('  MANAGER_ADMIN:  manager@dealflow.demo / demo1234');
  console.log('  OPS_FINANCE:    ops@dealflow.demo / demo1234');
  console.log('  CUSTOMER:       customer@dealflow.demo / demo1234');

  await close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
