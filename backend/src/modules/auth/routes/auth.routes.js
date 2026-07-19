'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const validate = require('../../../middlewares/validate');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/auth.validator');
const { authLimiter } = require('../../../middlewares/rateLimiter');

const router = Router();

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', authLimiter, registerValidator, validate, authController.register);

// POST /api/auth/login
router.post('/login', authLimiter, loginValidator, validate, authController.login);

// POST /api/auth/refresh
router.post('/refresh', authLimiter, authController.refresh);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET  /api/auth/verify-email?token=...
router.get('/verify-email', authController.verifyEmail);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  authLimiter,
  forgotPasswordValidator,
  validate,
  authController.forgotPassword,
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  authLimiter,
  resetPasswordValidator,
  validate,
  authController.resetPassword,
);

module.exports = router;
