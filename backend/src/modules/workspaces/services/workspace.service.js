'use strict';

const prisma = require('../../../lib/prisma');
const AppError = require('../../../utils/AppError');

const createWorkspace = async (userId, data) => {
  return prisma.workspace.create({
    data: {
      name: data.name,
      description: data.description,
      ownerId: userId,
    },
  });
};

const getWorkspaces = async (userId) => {
  // A user can see workspaces they own, OR workspaces where they are a project member.
  // For simplicity right now, let's fetch workspaces they own.
  // When project members are fully implemented, we'll expand this query.
  return prisma.workspace.findMany({
    where: { ownerId: userId },
    include: {
      _count: {
        select: { projects: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const getWorkspaceById = async (userId, workspaceId) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { projects: true }
  });

  if (!workspace) throw new AppError('Workspace not found', 404);
  
  // Basic authorization: Only owner can view for now (expand later for members)
  if (workspace.ownerId !== userId) {
    throw new AppError('Not authorized to access this workspace', 403);
  }

  return workspace;
};

const updateWorkspace = async (userId, workspaceId, data) => {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new AppError('Workspace not found', 404);
  
  if (workspace.ownerId !== userId) {
    throw new AppError('Only the owner can update the workspace', 403);
  }

  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
  });
};

const deleteWorkspace = async (userId, workspaceId) => {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new AppError('Workspace not found', 404);
  
  if (workspace.ownerId !== userId) {
    throw new AppError('Only the owner can delete the workspace', 403);
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
};
