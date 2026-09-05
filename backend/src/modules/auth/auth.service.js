'use strict';

const bcrypt = require('bcryptjs');
const jwtService = require('./jwt/jwt.service');
const userRepository = require('../../repositories/user.repository');
const { AppError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const otpService = require('./email/otp.service');
const emailService = require('../../services/email/email.service');

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    customer_id: user.customer_id,
    status: user.status,
    avatar_url: user.avatar_url,
  };
}

exports.register = async ({ name, email, password }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const skipEmail = process.env.EMAIL_PROVIDER === 'skip';
  if (skipEmail) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userRepository.create({ name, email, passwordHash, email_verified: true });
    const accessToken = jwtService.generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = jwtService.generateRefreshToken({ id: user.id });
    return { accessToken, refreshToken, user: sanitizeUser(user), message: 'Registration successful.' };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await otpService.storePendingRegistration(email, { name, email, passwordHash });
  await otpService.generateAndSendOtp(email);

  return { message: 'Registration successful. Please verify your email.' };
};

exports.verifyEmail = async ({ email, otp }) => {
  const pending = await otpService.getPendingRegistration(email);
  if (!pending) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('No pending registration found. Please register again.', 400);
    }
    await otpService.verifyOtp(email, otp);
    await userRepository.update(user.id, { email_verified: true });
    const accessToken = jwtService.generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = jwtService.generateRefreshToken({ id: user.id });
    return { accessToken, refreshToken, user: sanitizeUser(user) };
  }

  await otpService.verifyOtp(email, otp);

  const user = await userRepository.create({
    name: pending.name,
    email: pending.email,
    passwordHash: pending.passwordHash,
    email_verified: true
  });

  otpService.clearPendingRegistration(email);

  const accessToken = jwtService.generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = jwtService.generateRefreshToken({ id: user.id });

  return { accessToken, refreshToken, user: sanitizeUser(user) };
};

exports.resendOtp = async ({ email }) => {
  await otpService.resendOtp(email);

  return { message: 'OTP resent successfully' };
};

exports.forgotPassword = async ({ email }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    return { message: 'If the email exists, a reset link has been sent' };
  }

  const token = jwtService.generateAccessToken({ id: user.id, purpose: 'password-reset' }, '15m');

  await emailService.sendPasswordReset(email, user.name, token);

  return { message: 'If the email exists, a reset link has been sent' };
};

exports.resetPassword = async ({ token, password }) => {
  try {
    const decoded = jwtService.verifyAccessToken(token);
    if (decoded.purpose !== 'password-reset') {
      throw new AppError('Invalid token', 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await userRepository.update(decoded.id, { password_hash: passwordHash });

    return { message: 'Password reset successful' };
  } catch (err) {
    throw new AppError('Invalid or expired token', 400);
  }
};

exports.login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.password_hash) {
    throw new AppError('This account uses social login. Please use Google or GitHub to sign in.', 400);
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.email_verified && process.env.EMAIL_PROVIDER !== 'skip') {
    throw new AppError('Please verify your email first', 403);
  }

  if (user.status === 'inactive') {
    throw new AppError('Account is deactivated. Contact administrator.', 403);
  }

  const accessToken = jwtService.generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = jwtService.generateRefreshToken({ id: user.id });

  return { accessToken, refreshToken, user: sanitizeUser(user) };
};

exports.refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  const decoded = jwtService.verifyRefreshToken(refreshToken);
  const user = await userRepository.findById(decoded.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const newAccessToken = jwtService.generateAccessToken({ id: user.id, email: user.email, role: user.role });
  const newRefreshToken = jwtService.generateRefreshToken({ id: user.id });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

exports.getCurrentUser = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return { user: sanitizeUser(user) };
};
