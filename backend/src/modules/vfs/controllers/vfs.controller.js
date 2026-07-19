'use strict';

const vfsService = require('../services/vfs.service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');

// ─── Folders ─────────────────────────────────────────────────────────────────

const createFolder = asyncHandler(async (req, res) => {
  const folder = await vfsService.createFolder(req.user.id, req.params.projectId, req.body);
  sendSuccess(res, { statusCode: 201, message: 'Folder created', data: { folder } });
});

const renameFolder = asyncHandler(async (req, res) => {
  const folder = await vfsService.renameFolder(req.user.id, req.params.projectId, req.params.folderId, req.body.name);
  sendSuccess(res, { message: 'Folder renamed', data: { folder } });
});

const deleteFolder = asyncHandler(async (req, res) => {
  await vfsService.deleteFolder(req.user.id, req.params.projectId, req.params.folderId);
  sendSuccess(res, { message: 'Folder deleted' });
});

// ─── Files ───────────────────────────────────────────────────────────────────

const createFile = asyncHandler(async (req, res) => {
  const file = await vfsService.createFile(req.user.id, req.params.projectId, req.body);
  sendSuccess(res, { statusCode: 201, message: 'File created', data: { file } });
});

const renameFile = asyncHandler(async (req, res) => {
  const file = await vfsService.renameFile(req.user.id, req.params.projectId, req.params.fileId, req.body.name);
  sendSuccess(res, { message: 'File renamed', data: { file } });
});

const updateFileContent = asyncHandler(async (req, res) => {
  const file = await vfsService.updateFileContent(req.user.id, req.params.projectId, req.params.fileId, req.body.content);
  sendSuccess(res, { message: 'File saved', data: { file } });
});

const deleteFile = asyncHandler(async (req, res) => {
  await vfsService.deleteFile(req.user.id, req.params.projectId, req.params.fileId);
  sendSuccess(res, { message: 'File deleted' });
});

// ─── Tree & Content ──────────────────────────────────────────────────────────

const getProjectTree = asyncHandler(async (req, res) => {
  const tree = await vfsService.getProjectTree(req.user.id, req.params.projectId);
  sendSuccess(res, { data: tree });
});

const getFileContent = asyncHandler(async (req, res) => {
  const file = await vfsService.getFileContent(req.user.id, req.params.projectId, req.params.fileId);
  sendSuccess(res, { data: { file } });
});

module.exports = {
  createFolder,
  renameFolder,
  deleteFolder,
  createFile,
  renameFile,
  updateFileContent,
  deleteFile,
  getProjectTree,
  getFileContent,
};
