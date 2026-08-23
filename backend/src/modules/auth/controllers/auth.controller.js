'use strict';

const authService = require('../services/auth.service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const config = require('../../../config/env');

// ─── Cookie helper ────────────────────────────────────────────────────────────
const REFRESH_COOKIE = 'refreshToken';

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};

// ─── Controllers ─────────────────────────────────────────────────────────────

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful. Please check your email to verify your account.',
    data: { user },
  });
});

const login = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection?.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const { accessToken, refreshToken, user } = await authService.login({
    ...req.body,
    ipAddress,
    userAgent
  });
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, {
    message: 'Login successful.',
    data: { accessToken, user },
  });
});

const githubRedirect = asyncHandler(async (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&redirect_uri=${encodeURIComponent(config.github.callbackUrl)}&scope=user:email`;
  res.redirect(githubAuthUrl);
});

const githubCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  const ipAddress = req.ip || req.connection?.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  const { accessToken, refreshToken, user } = await authService.handleGithubCallback(code, {
    ipAddress,
    userAgent
  });
  
  setRefreshCookie(res, refreshToken);
  
  res.redirect(`${config.clientUrl}/auth/callback?token=${accessToken}`);
});

const refresh = asyncHandler(async (req, res) => {
  // Accept refresh token from httpOnly cookie (preferred) or body
  const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
  const { accessToken, refreshToken } = await authService.refreshTokens(token);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, {
    message: 'Token refreshed.',
    data: { accessToken },
  });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
  const ipAddress = req.ip || req.connection?.remoteAddress;
  const userAgent = req.headers['user-agent'];
  await authService.logout(token, { ipAddress, userAgent });
  clearRefreshCookie(res);
  sendSuccess(res, { message: 'Logged out successfully.' });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  await authService.verifyEmail(token);
  sendSuccess(res, { message: 'Email verified successfully. You can now log in.' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  // Always return the same message to prevent user enumeration
  sendSuccess(res, {
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  sendSuccess(res, { message: 'Password reset successful. Please log in with your new password.' });
});

module.exports = {
  register,
  login,
  githubRedirect,
  githubCallback,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
