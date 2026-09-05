'use strict';

const db = require('./database/index');
const bcrypt = require('bcryptjs');

const ACCOUNTS = [
  { email: 'rep@dealflow360.com', name: 'Sales Rep Demo', role: 'SALES_REP' },
  { email: 'sales@dealflow360.com', name: 'Sales Rep Demo', role: 'SALES_REP' },
  { email: 'manager@dealflow360.com', name: 'Sales Manager Demo', role: 'SALES_MANAGER' },
  { email: 'finance@dealflow360.com', name: 'Finance Demo', role: 'FINANCE' },
  { email: 'admin@dealflow360.com', name: 'Admin Demo', role: 'ADMIN' },
  { email: 'ops@dealflow360.com', name: 'Operations Demo', role: 'OPERATIONS' },
  { email: 'customer@dealflow360.com', name: 'Customer Demo', role: 'CUSTOMER' },
  { email: 'apex.buyer@dealflow360.com', name: 'Apex Buyer Demo', role: 'CUSTOMER' },
];

async function seed() {
  await db.connect();
  const hash = await bcrypt.hash('demo1234', 12);

  for (const acc of ACCOUNTS) {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [acc.email]);
    if (existing.rows.length > 0) {
      await db.query(
        'UPDATE users SET password_hash = $1, role = $2, email_verified = true, status = $3, updated_at = NOW() WHERE email = $4',
        [hash, acc.role, 'active', acc.email]
      );
      console.log(`Updated ${acc.email} (${acc.role})`);
    } else {
      await db.query(
        `INSERT INTO users (id, email, name, password_hash, role, email_verified, status)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, true, 'active')`,
        [acc.email, acc.name, hash, acc.role]
      );
      console.log(`Created ${acc.email} (${acc.role})`);
    }
  }

  await db.close();
  console.log('All demo users ready with password: demo1234');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
