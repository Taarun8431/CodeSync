'use strict';

/**
 * Send a standardised success response
 */
const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null } = {}) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

/**
 * Send a standardised error response
 */
const sendError = (
  res,
  { statusCode = 500, message = 'Internal Server Error', errors = null } = {},
) => {
  const payload = { success: false, message };
  if (errors !== null) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

module.exports = { sendSuccess, sendError };
