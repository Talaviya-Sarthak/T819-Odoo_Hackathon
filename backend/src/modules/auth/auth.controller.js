'use strict';

const authService = require('./auth.service');
const { sendSuccess } = require('../../utils/response');
const logger = require('../../utils/logger');

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, 201, 'Registration successful. Please verify your email.', result);
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const result = await authService.verifyEmail(req.body);
    sendSuccess(res, 200, 'Email verified successfully', result);
  } catch (err) {
    next(err);
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const result = await authService.resendOtp(req.body);
    sendSuccess(res, 200, 'OTP resent successfully', result);
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    sendSuccess(res, 200, 'Password reset email sent', result);
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    sendSuccess(res, 200, 'Password reset successful', result);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, 200, 'Login successful', result);
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await authService.refresh(refreshToken);
    sendSuccess(res, 200, 'Token refreshed', result);
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken');
    sendSuccess(res, 200, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const result = await authService.getCurrentUser(req.user.id);
    sendSuccess(res, 200, 'User fetched', result);
  } catch (err) {
    next(err);
  }
};

exports.oauthCallback = async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.authInfo;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
  } catch (err) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/login?error=auth_failed`);
  }
};
