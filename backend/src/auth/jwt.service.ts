import jwt from 'jsonwebtoken';
import { config } from '../common/config';
import { AppError } from '../common/errors';
import { JwtPayload } from '../common/types';

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
  });
}

export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
  } catch {
    throw new AppError('Invalid or expired access token', 401);
  }
}

export function verifyRefreshToken(token: string): { userId: string } {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }
}
