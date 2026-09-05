'use strict';

const nodemailer = require('nodemailer');
const config = require('../../config/env');
const logger = require('../../utils/logger');

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASSWORD
  }
});

async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: config.SMTP_FROM || config.SMTP_USER,
      to,
      subject,
      html
    });
    logger.info(`Email sent to ${to}`);
  } catch (err) {
    logger.error('Email send error:', err);
    throw err;
  }
}

async function sendVerificationOtp(email, name, otp) {
  const subject = 'Verify your email address';
  const html = `<div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
    <h2>Email Verification</h2>
    <p>Hi ${name || 'there'},</p>
    <p>Your verification code is:</p>
    <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; text-align: center;">${otp}</div>
    <p>This code expires in 10 minutes.</p>
    <p>If you didn't create an account, please ignore this email.</p>
  </div>`;
  return sendEmail({ to: email, subject, html });
}

async function sendPasswordReset(email, name, token) {
  const subject = 'Reset your password';
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const html = `<div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
    <h2>Password Reset</h2>
    <p>Hi ${name || 'there'},</p>
    <p>Click the link below to reset your password:</p>
    <a href="${clientUrl}/reset-password?token=${token}" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 4px;">Reset Password</a>
    <p>This link expires in 15 minutes.</p>
    <p>If you didn't request a password reset, please ignore this email.</p>
  </div>`;
  return sendEmail({ to: email, subject, html });
}

async function sendWelcome(email, name) {
  const subject = 'Welcome!';
  const html = `<div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
    <h2>Welcome!</h2>
    <p>Hi ${name || 'there'},</p>
    <p>Your account has been created and verified successfully.</p>
  </div>`;
  return sendEmail({ to: email, subject, html });
}

module.exports = { sendEmail, sendVerificationOtp, sendPasswordReset, sendWelcome };
