'use strict';

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

exports.errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  logger.error({ err }, 'Unhandled error');

  res.status(500).json({
    error: 'Internal server error'
  });
};
