'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../lib/prisma');

/**
 * Protects routes — extracts JWT from Authorization header,
 * verifies it, and attaches `req.user` for downstream handlers.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No token provided. Please log in.', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token); // throws on invalid/expired

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) {
    throw new AppError('User no longer exists.', 401);
  }

  req.user = user;
  next();
});

module.exports = authenticate;
