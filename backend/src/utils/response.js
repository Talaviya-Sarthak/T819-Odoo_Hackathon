'use strict';

exports.sendSuccess = (res, statusCode, message, data = null) => {
  const body = { message };
  if (data !== null) {
    Object.assign(body, data);
  }
  res.status(statusCode).json(body);
};

exports.sendError = (res, statusCode, message) => {
  res.status(statusCode).json({ error: message });
};
