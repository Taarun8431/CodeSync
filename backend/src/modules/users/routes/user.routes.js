'use strict';

const { Router } = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../../../middlewares/validate');
const authenticate = require('../../../middlewares/authenticate');
const {
  updateProfileValidator,
  changePasswordValidator,
} = require('../validators/user.validator');

const router = Router();

// ─── Protected Routes ────────────────────────────────────────────────────────
router.use(authenticate);

// GET /api/users/profile
router.get('/profile', userController.getProfile);

// PATCH /api/users/profile
router.patch('/profile', updateProfileValidator, validate, userController.updateProfile);

// POST /api/users/change-password
router.post(
  '/change-password',
  changePasswordValidator,
  validate,
  userController.changePassword,
);

module.exports = router;
