'use strict';

const prisma = require('../../../lib/prisma');
const AppError = require('../../../utils/AppError');

// ─── Projects ────────────────────────────────────────────────────────────────

const createProject = async (userId, data) => {
  // Check if workspace exists and user has access (for now, must be owner)
  const workspace = await prisma.workspace.findUnique({ where: { id: data.workspaceId } });
  if (!workspace) throw new AppError('Workspace not found', 404);
  if (workspace.ownerId !== userId) throw new AppError('Only the workspace owner can create projects', 403);

  // Create project and automatically add the creator as OWNER in ProjectMember
  return prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      workspaceId: data.workspaceId,
      members: {
        create: {
          userId: userId,
          role: 'OWNER',
        }
      }
    },
    include: { members: true }
  });
};

const getProjectsByWorkspace = async (userId, workspaceId) => {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new AppError('Workspace not found', 404);
  
  // Basic auth: owner only (will expand for members)
  if (workspace.ownerId !== userId) {
    throw new AppError('Not authorized', 403);
  }

  return prisma.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' }
  });
};

const getProjectById = async (userId, projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true, workspace: true }
  });

  if (!project) throw new AppError('Project not found', 404);
  
  // Check if user is a member or workspace owner
  const isMember = project.members.some(m => m.userId === userId);
  const isWorkspaceOwner = project.workspace.ownerId === userId;
  
  if (!isMember && !isWorkspaceOwner && !project.isPublic) {
    throw new AppError('Not authorized to access this project', 403);
  }

  return project;
};

const updateProject = async (userId, projectId, data) => {
  const project = await getProjectById(userId, projectId);
  
  // Must be OWNER or EDITOR to update project details
  const member = project.members.find(m => m.userId === userId);
  const isWorkspaceOwner = project.workspace.ownerId === userId;
  
  if (!isWorkspaceOwner && (!member || member.role === 'VIEWER')) {
    throw new AppError('Only owners or editors can update the project', 403);
  }

  return prisma.project.update({
    where: { id: projectId },
    data,
  });
};

const deleteProject = async (userId, projectId) => {
  const project = await getProjectById(userId, projectId);
  const member = project.members.find(m => m.userId === userId);
  const isWorkspaceOwner = project.workspace.ownerId === userId;
  
  if (!isWorkspaceOwner && (!member || member.role !== 'OWNER')) {
    throw new AppError('Only owners can delete the project', 403);
  }

  await prisma.project.delete({ where: { id: projectId } });
};

// ─── Members ────────────────────────────────────────────────────────────────

const addMember = async (requesterId, projectId, targetUserId, role = 'VIEWER') => {
  const project = await getProjectById(requesterId, projectId);
  const requester = project.members.find(m => m.userId === requesterId);
  const isWorkspaceOwner = project.workspace.ownerId === requesterId;

  if (!isWorkspaceOwner && (!requester || requester.role !== 'OWNER')) {
    throw new AppError('Only project owners can add members', 403);
  }

  // Check if target user exists
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) throw new AppError('Target user not found', 404);

  // Add or update member
  return prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId: targetUserId } },
    update: { role },
    create: { projectId, userId: targetUserId, role },
  });
};

const removeMember = async (requesterId, projectId, targetUserId) => {
  const project = await getProjectById(requesterId, projectId);
  const requester = project.members.find(m => m.userId === requesterId);
  const isWorkspaceOwner = project.workspace.ownerId === requesterId;

  if (requesterId !== targetUserId && !isWorkspaceOwner && (!requester || requester.role !== 'OWNER')) {
    throw new AppError('Only project owners can remove other members', 403);
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId: targetUserId } }
  });
};

module.exports = {
  createProject,
  getProjectsByWorkspace,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
