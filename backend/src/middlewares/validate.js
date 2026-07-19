'use strict';

const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Runs after express-validator chains.
 * Collects all validation errors and throws an AppError so the
 * central error handler can format and return them.
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new AppError('Validation failed.', 422);
    err.errors = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(err);
  }
  next();
};

module.exports = validate;
