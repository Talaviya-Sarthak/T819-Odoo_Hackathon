'use strict';

/**
 * DealFlow360 Seed Runner
 * Run: npm run seed or node src/seed.js
 */

require('dotenv').config();
const { runMasterSeed } = require('./seed_master');

if (require.main === module) {
  runMasterSeed()
    .then(() => {
      console.log('Seed execution completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed execution failed:', err);
      process.exit(1);
    });
}

module.exports = { runMasterSeed };
