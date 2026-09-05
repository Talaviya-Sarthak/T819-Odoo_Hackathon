'use strict';

require('tsx/cjs');
require('dotenv').config(); // Load backend/.env with Supabase & Neon configurations

const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const { connect } = require('./database/index');

async function start() {
  try {
    await connect();
    logger.info('Database connected');

    const { syncCustomerAccounts } = require('./services/customer-sync.service');
    await syncCustomerAccounts();

    const server = app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${config.PORT} is already in use by another process. Please terminate the existing process.`);
      } else {
        logger.error({ err }, 'Server socket error');
      }
      process.exit(1);
    });

    const shutdown = () => {
      logger.info('Shutting down server...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
