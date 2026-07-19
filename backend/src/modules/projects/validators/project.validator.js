'use strict';

const { body } = require('express-validator');

const createProjectValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required.')
    .isLength({ max: 50 })
    .withMessage('Project name must be under 50 characters.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be under 200 characters.'),

  body('workspaceId')
    .notEmpty()
    .withMessage('Workspace ID is required.')
    .isUUID()
    .withMessage('Invalid Workspace ID.'),
];

const updateProjectValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Project name cannot be empty.')
    .isLength({ max: 50 })
    .withMessage('Project name must be under 50 characters.'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be under 200 characters.'),
];

const memberValidator = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required.')
    .isUUID()
    .withMessage('Invalid User ID.'),
  
  body('role')
    .optional()
    .isIn(['OWNER', 'EDITOR', 'VIEWER'])
    .withMessage('Invalid role.')
];

module.exports = {
  createProjectValidator,
  updateProjectValidator,
  memberValidator,
};
