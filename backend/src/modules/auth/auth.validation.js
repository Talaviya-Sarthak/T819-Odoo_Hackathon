'use strict';

const { AppError } = require('../../utils/errors');

function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const message = result.error.errors.map(e => e.message).join(', ');
        return next(new AppError(message, 400));
      }
      req.body = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}

const registerSchema = {
  safeParse: (data) => {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push({ message: 'Name is required' });
    }
    if (!data.email || typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push({ message: 'Valid email is required' });
    }
    if (!data.password || typeof data.password !== 'string' || data.password.length < 8) {
      errors.push({ message: 'Password must be at least 8 characters' });
    }
    // roleId is optional - if provided, must be a string (UUID or role name)
    if (data.roleId !== undefined && data.roleId !== null && data.roleId !== '') {
      if (typeof data.roleId !== 'string' || data.roleId.trim().length === 0) {
        errors.push({ message: 'Invalid role selected' });
      }
    }

    if (errors.length > 0) {
      return { success: false, error: { errors } };
    }
    return {
      success: true,
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        roleId: data.roleId || null,
      }
    };
  }
};

const loginSchema = {
  safeParse: (data) => {
    const errors = [];

    if (!data.email || typeof data.email !== 'string') {
      errors.push({ message: 'Email is required' });
    }
    if (!data.password || typeof data.password !== 'string') {
      errors.push({ message: 'Password is required' });
    }

    if (errors.length > 0) {
      return { success: false, error: { errors } };
    }
    return { success: true, data: { email: data.email.toLowerCase().trim(), password: data.password } };
  }
};

const verifyOtpSchema = {
  safeParse: (data) => {
    const errors = [];

    if (!data.email || typeof data.email !== 'string') {
      errors.push({ message: 'Email is required' });
    }
    if (!data.otp || typeof data.otp !== 'string' || data.otp.length !== 6) {
      errors.push({ message: 'OTP must be 6 digits' });
    }

    if (errors.length > 0) {
      return { success: false, error: { errors } };
    }
    return { success: true, data: { email: data.email.toLowerCase().trim(), otp: data.otp } };
  }
};

const forgotPasswordSchema = {
  safeParse: (data) => {
    const errors = [];

    if (!data.email || typeof data.email !== 'string') {
      errors.push({ message: 'Email is required' });
    }

    if (errors.length > 0) {
      return { success: false, error: { errors } };
    }
    return { success: true, data: { email: data.email.toLowerCase().trim() } };
  }
};

const resetPasswordSchema = {
  safeParse: (data) => {
    const errors = [];

    if (!data.token || typeof data.token !== 'string') {
      errors.push({ message: 'Token is required' });
    }
    if (!data.password || typeof data.password !== 'string' || data.password.length < 8) {
      errors.push({ message: 'Password must be at least 8 characters' });
    }

    if (errors.length > 0) {
      return { success: false, error: { errors } };
    }
    return { success: true, data: { token: data.token, password: data.password } };
  }
};

exports.validateRegister = validate(registerSchema);
exports.validateLogin = validate(loginSchema);
exports.validateVerifyOtp = validate(verifyOtpSchema);
exports.validateForgotPassword = validate(forgotPasswordSchema);
exports.validateResetPassword = validate(resetPasswordSchema);
