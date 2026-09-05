'use strict';

const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validateRegister, validateLogin, validateVerifyOtp, validateForgotPassword, validateResetPassword } = require('./auth.validation');
const rbacService = require('../../services/rbac.service');
const { sendSuccess } = require('../../utils/response');

// Public: get roles available for self-registration
router.get('/roles', async (req, res, next) => {
  try {
    const roles = await rbacService.getPublicRoles();
    sendSuccess(res, 200, 'Roles fetched', { roles });
  } catch (err) {
    next(err);
  }
});

router.post('/register', validateRegister, authController.register);
router.post('/verify-email', validateVerifyOtp, authController.verifyEmail);
router.post('/resend-otp', authController.resendOtp);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

const passport = require('passport');

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: (process.env.CLIENT_URL || 'http://localhost:5173') + '/login', session: false }),
  authController.oauthCallback
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: (process.env.CLIENT_URL || 'http://localhost:5173') + '/login', session: false }),
  authController.oauthCallback
);

module.exports = router;
