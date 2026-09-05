'use strict';

require('dotenv').config();

const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const { connect } = require('./database/index');

async function start() {
  try {
    await connect();
    logger.info('Database connected');

    app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

start();
