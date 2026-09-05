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

    if (req.user && req.user.role === 'CUSTOMER' && !req.user.customerId && !req.user.customer_id) {
      try {
        const prisma = require('../database/prisma');
        const dbUser = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { customerId: true },
        });
        if (dbUser?.customerId) {
          req.user.customerId = dbUser.customerId;
          req.user.customer_id = dbUser.customerId;
        }
      } catch (e) {
        // Continue if DB lookup fails
      }
    }

    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
};
