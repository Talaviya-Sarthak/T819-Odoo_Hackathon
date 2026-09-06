'use strict';

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

exports.errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  if (err && (err.name === 'ApiError' || (err.statusCode && err.statusCode < 500))) {
    return res.status(err.statusCode || 400).json({
      error: err.message,
      code: err.code,
      suggestion: err.suggestion,
    });
  }

  logger.error({ err }, 'Unhandled error');

  res.status(err?.statusCode || 500).json({
    error: err?.message || 'Internal server error'
  });
};