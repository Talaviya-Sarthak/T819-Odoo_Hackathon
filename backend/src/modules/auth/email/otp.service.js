'use strict';

const bcrypt = require('bcryptjs');
const { AppError } = require('../../../utils/errors');
const emailService = require('../../../services/email/email.service');
const logger = require('../../../utils/logger');

const otpStore = new Map();
const pendingRegistrations = new Map();

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH) || 6;
const OTP_EXPIRES_IN = parseInt(process.env.OTP_EXPIRES_IN) || 10;
const RESEND_COOLDOWN = parseInt(process.env.RESEND_COOLDOWN) || 60;
const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;

function generateOtp() {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

exports.storePendingRegistration = async (email, data) => {
  pendingRegistrations.set(email, data);
};

exports.getPendingRegistration = async (email) => {
  return pendingRegistrations.get(email) || null;
};

exports.clearPendingRegistration = async (email) => {
  pendingRegistrations.delete(email);
};

exports.generateAndSendOtp = async (email) => {
  const otp = generateOtp();
  const hash = await bcrypt.hash(otp, 10);

  otpStore.set(email, {
    hash,
    expiresAt: Date.now() + OTP_EXPIRES_IN * 60 * 1000,
    attempts: 0,
    lastSent: Date.now()
  });

  logger.info(`[AUTH] Verification OTP for ${email}: ${otp}`);

  try {
    await emailService.sendVerificationOtp(email, null, otp);
  } catch (err) {
    logger.warn(`Failed to send verification email to ${email}: ${err.message}. Use OTP from server console: ${otp}`);
    if (process.env.NODE_ENV !== 'development' && process.env.EMAIL_PROVIDER !== 'skip') {
      throw new AppError('Unable to send verification email. Please try again.', 500);
    }
  }
};

exports.verifyOtp = async (email, otp) => {
  const stored = otpStore.get(email);
  if (!stored) {
    throw new AppError('No OTP found. Please request a new one.', 400);
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  if (stored.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(email);
    throw new AppError('Too many attempts. Please request a new OTP.', 429);
  }

  stored.attempts++;

  const isValid = await bcrypt.compare(otp, stored.hash);
  if (!isValid) {
    throw new AppError('Invalid OTP', 400);
  }

  otpStore.delete(email);
  return true;
};

exports.resendOtp = async (email) => {
  const stored = otpStore.get(email);
  if (stored && Date.now() - stored.lastSent < RESEND_COOLDOWN * 1000) {
    const waitTime = Math.ceil((RESEND_COOLDOWN * 1000 - (Date.now() - stored.lastSent)) / 1000);
    throw new AppError(`Please wait ${waitTime} seconds before resending`, 429);
  }

  await exports.generateAndSendOtp(email);
};
