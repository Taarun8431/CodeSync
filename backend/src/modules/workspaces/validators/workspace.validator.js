'use strict';

const { body } = require('express-validator');

const createWorkspaceValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Workspace name is required.')
    .isLength({ max: 50 })
    .withMessage('Workspace name must be under 50 characters.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be under 200 characters.')
];

const updateWorkspaceValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Workspace name cannot be empty.')
    .isLength({ max: 50 })
    .withMessage('Workspace name must be under 50 characters.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be under 200 characters.')
];

module.exports = {
  createWorkspaceValidator,
  updateWorkspaceValidator,
};
