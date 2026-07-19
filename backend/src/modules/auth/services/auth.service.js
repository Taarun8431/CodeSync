'use strict';

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../../../lib/prisma');
const { hashPassword, comparePassword } = require('../../../utils/hash');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../../../utils/jwt');
const { sendEmail, emailTemplates } = require('../../../utils/mailer');
const AppError = require('../../../utils/AppError');
const config = require('../../../config/env');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a cryptographically random hex token */
const randomToken = () => crypto.randomBytes(32).toString('hex');

/** Calculate expiry date from now + hours */
const expiresFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);

/**
 * Issue a new access + refresh token pair and persist the refresh token.
 * If an existing refresh token is provided (rotation), the old one is deleted.
 */
const issueTokenPair = async (userId, oldRefreshToken = null) => {
  const payload = { userId };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Refresh token rotation: delete old token, store new one
  if (oldRefreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: oldRefreshToken } });
  }

  const expiresAt = expiresFromNow(7 * 24); // 7 days
  await prisma.refreshToken.create({
    data: { id: uuidv4(), token: refreshToken, userId, expiresAt },
  });

  return { accessToken, refreshToken };
};

// ─── Service Methods ──────────────────────────────────────────────────────────

const register = async ({ username, email, password }) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    if (existing.email === email) throw new AppError('Email is already registered.', 409);
    throw new AppError('Username is already taken.', 409);
  }

  const hashedPassword = await hashPassword(password);
  const emailVerifyToken = randomToken();
  const emailVerifyExpiry = expiresFromNow(24);

  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      emailVerifyToken,
      emailVerifyExpiry,
    },
  });

  // Send verification email (non-blocking — don't fail registration if email fails)
  const verifyUrl = `${config.clientUrl}/verify-email?token=${emailVerifyToken}`;
  const template = emailTemplates.emailVerification(username, verifyUrl);
  sendEmail({ to: email, ...template }).catch(() => {
    // log silently — email failure must not block registration
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Use the same error message for both "not found" and "wrong password"
  // to prevent user enumeration attacks
  if (!user) throw new AppError('Invalid email or password.', 401);

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new AppError('Invalid email or password.', 401);

  const { accessToken, refreshToken } = await issueTokenPair(user.id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    },
  };
};

const refreshTokens = async (token) => {
  if (!token) throw new AppError('Refresh token is required.', 401);

  // Verify signature + expiry
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  // Check it exists in DB (token rotation — once used, it's gone)
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    // Possible token reuse — invalidate all tokens for the user (security measure)
    await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } });
    throw new AppError('Refresh token is invalid. Please log in again.', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(
    decoded.userId,
    token, // rotate: delete old, store new
  );

  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (token) => {
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }
};

const verifyEmail = async (token) => {
  if (!token) throw new AppError('Verification token is required.', 400);

  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new AppError('Invalid or expired verification token.', 400);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpiry: null,
    },
  });
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success — don't reveal whether email exists
  if (!user) return;

  const resetToken = randomToken();
  const resetExpiry = expiresFromNow(1); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: resetToken, passwordResetExpiry: resetExpiry },
  });

  const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
  const template = emailTemplates.passwordReset(user.username, resetUrl);
  await sendEmail({ to: email, ...template });
};

const resetPassword = async ({ token, password }) => {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new AppError('Invalid or expired reset token.', 400);

  const hashedPassword = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  // Invalidate all existing refresh tokens (force re-login on all devices)
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
};

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
