'use strict';

/**
 * Workspace Service
 *
 * Workspace visibility fix:
 *   Old: Only workspace owners could see their workspaces.
 *        Members of projects INSIDE a workspace couldn't see it.
 *
 *   New: A user sees a workspace if:
 *        (a) They own it (ownerId === userId), OR
 *        (b) They are a ProjectMember of at least one project in that workspace
 *
 * This is the "TODO: expand for members" that was noted in the original code.
 */

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

/**
 * getWorkspaces
 * Returns all workspaces a user owns OR is a project member in.
 */
const getWorkspaces = async (userId) => {
  return prisma.workspace.findMany({
    where: {
      OR: [
        // (a) User owns this workspace
        { ownerId: userId },
        // (b) User is a member of at least one project inside this workspace
        {
          projects: {
            some: {
              members: {
                some: { userId },
              },
            },
          },
        },
      ],
    },
    include: {
      _count: {
        select: { projects: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * getWorkspaceById
 * Returns a single workspace if the user owns it OR is a project member within it.
 */
const getWorkspaceById = async (userId, workspaceId) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { projects: true },
  });

  if (!workspace) throw new AppError('Workspace not found', 404);

  // Check if user is owner
  const isOwner = workspace.ownerId === userId;

  if (!isOwner) {
    // Check if user is a member of any project in this workspace
    const memberProject = await prisma.project.findFirst({
      where: {
        workspaceId,
        members: { some: { userId } },
      },
    });

    if (!memberProject) {
      throw new AppError('Not authorized to access this workspace', 403);
    }
  }

  return workspace;
};

const updateWorkspace = async (userId, workspaceId, data) => {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new AppError('Workspace not found', 404);

  if (workspace.ownerId !== userId) {
    throw new AppError('Only the owner can update the workspace', 403);
  }

  return prisma.workspace.update({ where: { id: workspaceId }, data });
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
