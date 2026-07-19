'use strict';

const { body } = require('express-validator');

const createFolderValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Folder name is required.')
    .matches(/^[^\\/?%*:|"<>]+$/)
    .withMessage('Folder name contains invalid characters.')
    .isLength({ max: 255 }),
  
  body('parentId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Invalid Parent Folder ID.'),
];

const createFileValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('File name is required.')
    .matches(/^[^\\/?%*:|"<>]+$/)
    .withMessage('File name contains invalid characters.')
    .isLength({ max: 255 }),
  
  body('folderId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Invalid Folder ID.'),
    
  body('language')
    .optional()
    .isString(),
    
  body('content')
    .optional()
    .isString(),
];

const renameValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .matches(/^[^\\/?%*:|"<>]+$/)
    .withMessage('Name contains invalid characters.')
    .isLength({ max: 255 }),
];

module.exports = {
  createFolderValidator,
  createFileValidator,
  renameValidator,
};
