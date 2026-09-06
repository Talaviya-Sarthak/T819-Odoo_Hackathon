'use strict';

/**
 * DealFlow360 Prisma Seed Hook
 * Invoked by: npx prisma db seed
 */

const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
} catch (e) {
  // fallback
}

const { runMasterSeed } = require('../backend/src/seed_master');

if (require.main === module) {
  runMasterSeed()
    .then(() => {
      console.log('Prisma seed execution completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Prisma seed execution failed:', err);
      process.exit(1);
    });
}

module.exports = { runMasterSeed };
