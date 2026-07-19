'use strict';

const prisma = require('../../../lib/prisma');
const AppError = require('../../../utils/AppError');

// Authorization helper to check if user can access the project
const verifyProjectAccess = async (userId, projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true, workspace: true },
  });

  if (!project) throw new AppError('Project not found', 404);

  const isMember = project.members.some((m) => m.userId === userId);
  const isWorkspaceOwner = project.workspace.ownerId === userId;

  if (!isMember && !isWorkspaceOwner && !project.isPublic) {
    throw new AppError('Not authorized to access this project', 403);
  }

  // Return member role to check write access (VIEWER cannot write)
  const role = isWorkspaceOwner ? 'OWNER' : project.members.find((m) => m.userId === userId)?.role;
  return { project, role };
};

const verifyWriteAccess = async (userId, projectId) => {
  const { role } = await verifyProjectAccess(userId, projectId);
  if (role === 'VIEWER') {
    throw new AppError('You only have view access to this project', 403);
  }
};

// ─── Folders ─────────────────────────────────────────────────────────────────

const createFolder = async (userId, projectId, data) => {
  await verifyWriteAccess(userId, projectId);

  // Check for duplicate name in the same parent
  const existing = await prisma.folder.findFirst({
    where: { projectId, parentId: data.parentId || null, name: data.name },
  });
  if (existing) throw new AppError('Folder with this name already exists in this directory', 409);

  return prisma.folder.create({
    data: {
      name: data.name,
      projectId,
      parentId: data.parentId || null,
    },
  });
};

const renameFolder = async (userId, projectId, folderId, newName) => {
  await verifyWriteAccess(userId, projectId);
  
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) throw new AppError('Folder not found', 404);

  const existing = await prisma.folder.findFirst({
    where: { projectId, parentId: folder.parentId, name: newName },
  });
  if (existing && existing.id !== folderId) throw new AppError('Folder with this name already exists', 409);

  return prisma.folder.update({
    where: { id: folderId },
    data: { name: newName },
  });
};

const deleteFolder = async (userId, projectId, folderId) => {
  await verifyWriteAccess(userId, projectId);
  await prisma.folder.delete({ where: { id: folderId } });
};

// ─── Files ───────────────────────────────────────────────────────────────────

const createFile = async (userId, projectId, data) => {
  await verifyWriteAccess(userId, projectId);

  const existing = await prisma.file.findFirst({
    where: { projectId, folderId: data.folderId || null, name: data.name },
  });
  if (existing) throw new AppError('File with this name already exists in this directory', 409);

  return prisma.file.create({
    data: {
      name: data.name,
      content: data.content || '',
      language: data.language || 'plaintext',
      projectId,
      folderId: data.folderId || null,
    },
  });
};

const renameFile = async (userId, projectId, fileId, newName) => {
  await verifyWriteAccess(userId, projectId);
  
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw new AppError('File not found', 404);

  const existing = await prisma.file.findFirst({
    where: { projectId, folderId: file.folderId, name: newName },
  });
  if (existing && existing.id !== fileId) throw new AppError('File with this name already exists', 409);

  return prisma.file.update({
    where: { id: fileId },
    data: { name: newName },
  });
};

const updateFileContent = async (userId, projectId, fileId, content) => {
  await verifyWriteAccess(userId, projectId);
  return prisma.file.update({
    where: { id: fileId },
    data: { content },
  });
};

const deleteFile = async (userId, projectId, fileId) => {
  await verifyWriteAccess(userId, projectId);
  await prisma.file.delete({ where: { id: fileId } });
};

// ─── Tree ────────────────────────────────────────────────────────────────────

const getProjectTree = async (userId, projectId) => {
  await verifyProjectAccess(userId, projectId);

  const folders = await prisma.folder.findMany({ where: { projectId } });
  const files = await prisma.file.findMany({
    where: { projectId },
    select: { id: true, name: true, language: true, folderId: true, updatedAt: true } // Exclude content for tree view
  });

  return { folders, files };
};

const getFileContent = async (userId, projectId, fileId) => {
  await verifyProjectAccess(userId, projectId);
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) throw new AppError('File not found', 404);
  return file;
};

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
