'use strict';

const jwt = require('jsonwebtoken');
const config = require('../../../config/env');
const { AppError } = require('../../../utils/errors');

exports.generateAccessToken = (payload, expiresIn) => {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: expiresIn || config.JWT_ACCESS_EXPIRES_IN
  });
};

exports.generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN
  });
};

exports.verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired access token', 401);
  }
};

exports.verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
};
