'use strict';

const workspaceService = require('../services/workspace.service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');

const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.createWorkspace(req.user.id, req.body);
  sendSuccess(res, {
    statusCode: 201,
    message: 'Workspace created successfully',
    data: { workspace },
  });
});

const getWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.getWorkspaces(req.user.id);
  sendSuccess(res, {
    message: 'Workspaces retrieved successfully',
    data: { workspaces },
  });
});

const getWorkspaceById = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.getWorkspaceById(req.user.id, req.params.id);
  sendSuccess(res, {
    message: 'Workspace retrieved successfully',
    data: { workspace },
  });
});

const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.updateWorkspace(req.user.id, req.params.id, req.body);
  sendSuccess(res, {
    message: 'Workspace updated successfully',
    data: { workspace },
  });
});

const deleteWorkspace = asyncHandler(async (req, res) => {
  await workspaceService.deleteWorkspace(req.user.id, req.params.id);
  sendSuccess(res, {
    message: 'Workspace deleted successfully',
  });
});

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
};
