'use strict';

const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validateRegister, validateLogin, validateVerifyOtp, validateForgotPassword, validateResetPassword } = require('./auth.validation');
const rbacService = require('../../services/rbac.service');
const { generateKey, cache } = require('../../cache');
const { sendSuccess } = require('../../utils/response');

// Cache for public roles - fetched once, valid for 10 minutes
const PUBLIC_ROLES_CACHE_KEY = 'auth:public:roles';

router.get('/roles', async (req, res, next) => {
  try {
    // Check cache first
    const cachedRoles = cache.has(PUBLIC_ROLES_CACHE_KEY) ? cache.get(PUBLIC_ROLES_CACHE_KEY) : null;
    let roles;

    if (cachedRoles) {
      roles = cachedRoles;
    } else {
      const rolesData = await rbacService.getPublicRoles();
      roles = rolesData.roles || rolesData;
      // Cache for 10 minutes
      cache.set(PUBLIC_ROLES_CACHE_KEY, roles, 10 * 60);
    }

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
