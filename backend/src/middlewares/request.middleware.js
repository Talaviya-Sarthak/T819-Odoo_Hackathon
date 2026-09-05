'use strict';

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

exports.requestLogger = (req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};
