'use strict';

const prisma = require('../../../lib/prisma');
const { hashPassword, comparePassword } = require('../../../utils/hash');
const AppError = require('../../../utils/AppError');

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

const updateProfile = async (userId, data) => {
  const updateData = {};

  if (data.username) {
    // Check if username is already taken
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing && existing.id !== userId) {
      throw new AppError('Username is already taken.', 409);
    }
    updateData.username = data.username;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError('Incorrect current password.', 401);
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Optionally: invalidate all other sessions (refresh tokens) here to force re-login on other devices.
  await prisma.refreshToken.deleteMany({
    where: { userId: userId },
  });
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
