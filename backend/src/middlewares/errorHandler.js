'use strict';

const { sendError } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, _next) => {
  // Operational errors: our own AppError instances
  if (err instanceof AppError) {
    // If there are validation errors attached, use the first one's message instead of the generic "Validation failed."
    const message = err.errors && err.errors.length > 0 ? err.errors[0].message : err.message;
    return sendError(res, { statusCode: err.statusCode, message, errors: err.errors });
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return sendError(res, { statusCode: 409, message: `${field} already exists.` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, { statusCode: 401, message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, { statusCode: 401, message: 'Token has expired.' });
  }

  // Express validation errors (express-validator)
  if (err.type === 'validation') {
    return sendError(res, { statusCode: 422, message: 'Validation failed.', errors: err.errors });
  }

  // Unknown / programmer errors — don't leak details in production
  const isDev = process.env.NODE_ENV === 'development';
  return sendError(res, {
    statusCode: 500,
    message: isDev ? err.message : 'Something went wrong. Please try again.',
  });
};

module.exports = errorHandler;
