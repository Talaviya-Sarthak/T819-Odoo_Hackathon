'use strict';

const jwtService = require('../modules/auth/jwt/jwt.service');
const { AppError } = require('../utils/errors');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwtService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
};
