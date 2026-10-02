'use strict';

/**
 * OAuth Code Exchange Integration/Unit Tests
 *
 * Tests cover:
 *   - Successful exchange of valid one-time code for access token & user
 *   - Replay attack prevention (code cannot be exchanged twice)
 *   - Missing exchange code rejection (400 Bad Request)
 *   - Invalid or expired exchange code rejection (401 Unauthorized)
 */

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../src/modules/auth/routes/auth.routes');
const authController = require('../src/modules/auth/controllers/auth.controller');
const crypto = require('crypto');

// Mock auth.service
jest.mock('../src/modules/auth/services/auth.service', () => ({
  handleGithubCallback: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
  refreshTokens: jest.fn(),
  logout: jest.fn(),
}));

const authService = require('../src/modules/auth/services/auth.service');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/auth', authRoutes);

// Error handler middleware
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    status: 'error',
    message: err.message,
  });
});

describe('Secure OAuth Code Exchange (/api/v1/auth/oauth/exchange)', () => {
  it('should complete OAuth callback by redirecting with a temporary code (NOT access token)', async () => {
    authService.handleGithubCallback.mockResolvedValue({
      accessToken: 'secure-jwt-access-token',
      refreshToken: 'secure-refresh-token',
      user: { id: 'user-gh-1', username: 'githubber', email: 'gh@example.com' },
    });

    const res = await request(app)
      .get('/api/v1/auth/github/callback?code=mock-gh-oauth-code')
      .expect(302);

    const redirectUrl = res.headers.location;
    // URL must contain code=..., NEVER token=...
    expect(redirectUrl).toContain('/auth/callback?code=');
    expect(redirectUrl).not.toContain('secure-jwt-access-token');
    expect(redirectUrl).not.toContain('token=');

    // Extract the exchange code from redirect
    const url = new URL(redirectUrl);
    const exchangeCode = url.searchParams.get('code');
    expect(exchangeCode).toBeTruthy();

    // Now exchange the code via POST
    const exchangeRes = await request(app)
      .post('/api/v1/auth/oauth/exchange')
      .send({ code: exchangeCode })
      .expect(200);

    expect(exchangeRes.body.data).toHaveProperty('accessToken', 'secure-jwt-access-token');
    expect(exchangeRes.body.data.user).toHaveProperty('username', 'githubber');

    // Attempting to REUSE the same code must fail (single-use replay prevention)
    const replayRes = await request(app)
      .post('/api/v1/auth/oauth/exchange')
      .send({ code: exchangeCode })
      .expect(401);

    expect(replayRes.body.message).toContain('Invalid or expired exchange code');
  });

  it('should return 400 if exchange code is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/oauth/exchange')
      .send({})
      .expect(400);

    expect(res.body.message).toContain('Exchange code is required');
  });

  it('should return 401 for a forged or non-existent exchange code', async () => {
    const res = await request(app)
      .post('/api/v1/auth/oauth/exchange')
      .send({ code: 'non-existent-or-forged-code' })
      .expect(401);

    expect(res.body.message).toContain('Invalid or expired exchange code');
  });
});
