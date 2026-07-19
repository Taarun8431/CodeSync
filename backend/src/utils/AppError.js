'use strict';

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguish from programmer errors
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
