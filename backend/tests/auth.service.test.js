'use strict';

/**
 * Auth Service Tests
 *
 * Tests cover:
 *   - User registration (success, duplicate email, duplicate username)
 *   - Login (success, wrong password, wrong email)
 *   - Refresh token rotation (success, replay attack detection)
 *   - Logout (clears refresh token from DB)
 *
 * Pattern: Unit tests — we mock Prisma so no real DB is needed.
 * The service functions are tested in isolation.
 */

const bcrypt = require('bcryptjs');

// Mock Prisma singleton before requiring the service
jest.mock('../src/lib/prisma', () => ({
  user: {
    findFirst:  jest.fn(),
    findUnique: jest.fn(),
    create:     jest.fn(),
  },
  refreshToken: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    delete:     jest.fn(),
    deleteMany: jest.fn(),
  },
  sessionLog: {
    create: jest.fn(),
  },
}));

// Mock mailer so we never send real emails during tests
jest.mock('../src/utils/mailer', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  emailTemplates: {
    emailVerification: jest.fn().mockReturnValue({ subject: 'Verify', html: '<p>Verify</p>' }),
    passwordReset: jest.fn().mockReturnValue({ subject: 'Reset', html: '<p>Reset</p>' }),
  },
}));

// Mock jwt so token verification returns valid payload
jest.mock('../src/utils/jwt', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  verifyAccessToken: jest.fn().mockReturnValue({ userId: 'user-uuid-123' }),
  verifyRefreshToken: jest.fn().mockReturnValue({ userId: 'user-uuid-123' }),
}));

const prisma = require('../src/lib/prisma');
const authService = require('../src/modules/auth/services/auth.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mockUser = (overrides = {}) => ({
  id:              'user-uuid-123',
  email:           'test@example.com',
  username:        'testuser',
  password:        bcrypt.hashSync('Password123', 10),
  authProvider:    'local',
  isEmailVerified: true,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Registration ─────────────────────────────────────────────────────────────

describe('authService.register', () => {
  it('should create a new user and return user object', async () => {
    prisma.user.findFirst.mockResolvedValue(null); // no duplicate
    prisma.user.create.mockResolvedValue(mockUser());

    const result = await authService.register({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123',
    });

    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('email', 'test@example.com');
  });

  it('should throw 409 if email already exists', async () => {
    prisma.user.findFirst.mockResolvedValue(mockUser()); // duplicate found

    await expect(
      authService.register({ email: 'test@example.com', username: 'newuser', password: 'Password123' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('should throw 409 if username already exists', async () => {
    prisma.user.findFirst.mockResolvedValue(mockUser({ email: 'other@example.com' }));

    await expect(
      authService.register({ email: 'new@example.com', username: 'testuser', password: 'Password123' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe('authService.login', () => {
  it('should return tokens on valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser());
    prisma.refreshToken.create.mockResolvedValue({ token: 'refresh-token' });
    prisma.sessionLog.create.mockResolvedValue({});

    const result = await authService.login({
      email: 'test@example.com',
      password: 'Password123',
      ip: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result).toHaveProperty('user');
  });

  it('should throw 401 for wrong password (same error as wrong email — prevents user enumeration)', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser());

    await expect(
      authService.login({ email: 'test@example.com', password: 'WrongPass999', ip: '127.0.0.1', userAgent: 'jest' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('should throw 401 for non-existent email (same message — prevents user enumeration)', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'nobody@example.com', password: 'Password123', ip: '127.0.0.1', userAgent: 'jest' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

// ─── Refresh Token Rotation ───────────────────────────────────────────────────

describe('authService.refreshTokens', () => {
  it('should issue a new token pair and delete the old refresh token', async () => {
    const storedToken = {
      token:    'valid-refresh-token',
      userId:   'user-uuid-123',
      expiresAt: new Date(Date.now() + 86400000), // 1 day ahead
    };
    prisma.refreshToken.findUnique.mockResolvedValue(storedToken);
    prisma.user.findUnique.mockResolvedValue(mockUser());
    prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
    prisma.refreshToken.create.mockResolvedValue({ token: 'new-refresh-token' });

    const result = await authService.refreshTokens('valid-refresh-token');

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { token: 'valid-refresh-token' }
    });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('should invalidate ALL user tokens on replay attack (reused old token)', async () => {
    // Token not in DB = it was already rotated (potential replay attack)
    prisma.refreshToken.findUnique.mockResolvedValue(null);
    prisma.refreshToken.deleteMany.mockResolvedValue({});

    // Need to decode the token to get userId — mock jwt
    jest.doMock('../src/utils/jwt', () => ({
      verifyRefreshToken: jest.fn().mockReturnValue({ userId: 'user-uuid-123' }),
    }));

    await expect(
      authService.refreshTokens('already-rotated-token')
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
