'use strict';

const rateLimit = require('express-rate-limit');

// Disable limiters in development for easier testing if desired
const isDev = process.env.NODE_ENV === 'development';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Temporarily increased for Enterprise Stress Test
  skip: (req) => process.env.NODE_ENV === 'development', // Skip in dev
  message: {
    status: 'error',
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const executionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDev ? 1000 : 15, // Limit each IP to 15 execution requests per minute
  message: {
    status: 'error',
    message: 'Too many code execution requests from this IP, please try again after 1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  executionLimiter,
};
