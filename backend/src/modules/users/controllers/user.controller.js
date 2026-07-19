'use strict';

const userService = require('../services/user.service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');

const getProfile = asyncHandler(async (req, res) => {
  // req.user is populated by authenticate middleware
  const user = await userService.getProfile(req.user.id);
  sendSuccess(res, {
    message: 'Profile retrieved successfully.',
    data: { user },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  sendSuccess(res, {
    message: 'Profile updated successfully.',
    data: { user },
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await userService.changePassword(req.user.id, currentPassword, newPassword);
  
  // Note: the service invalidates all active sessions when the password is changed.
  // The client will need to login again. We should also clear the current refresh cookie.
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  sendSuccess(res, {
    message: 'Password changed successfully. Please log in again.',
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
