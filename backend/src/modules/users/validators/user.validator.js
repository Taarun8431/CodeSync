'use strict';

const { body } = require('express-validator');

const updateProfileValidator = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters.')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username may only contain letters, numbers and underscores.'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required.')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters.')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter.')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number.'),
];

module.exports = {
  updateProfileValidator,
  changePasswordValidator,
};
