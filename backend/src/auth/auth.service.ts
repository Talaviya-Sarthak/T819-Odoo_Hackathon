import bcrypt from 'bcryptjs';
import prisma from '../common/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './jwt.service';
import { AppError, BadRequestError, UnauthorizedError, NotFoundError } from '../common/errors';
import { JwtPayload } from '../common/types';

function sanitizeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (!user.passwordHash) {
    throw new AppError('This account uses social login. Please use Google or GitHub to sign in.', 400);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.status === 'inactive') {
    throw new AppError('Account is deactivated. Contact administrator.', 403);
  }

  const jwtPayload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(jwtPayload);
  const refreshToken = generateRefreshToken({ userId: user.id });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
}

export async function refreshToken(token: string) {
  if (!token) {
    throw new UnauthorizedError('Refresh token required');
  }

  const decoded = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const jwtPayload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
  const newAccessToken = generateAccessToken(jwtPayload);
  const newRefreshToken = generateRefreshToken({ userId: user.id });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return { user: sanitizeUser(user) };
}
