'use strict';

const crypto = require('crypto');
const prisma = require('../../../lib/prisma');
const AppError = require('../../../utils/AppError');
const projectService = require('../services/project.service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');

// ─── Projects ────────────────────────────────────────────────────────────────

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user.id, req.body);
  sendSuccess(res, {
    statusCode: 201,
    message: 'Project created successfully',
    data: { project },
  });
});

const getProjectsByWorkspace = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjectsByWorkspace(req.user.id, req.query.workspaceId);
  sendSuccess(res, {
    message: 'Projects retrieved successfully',
    data: { projects },
  });
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.user.id, req.params.id);
  sendSuccess(res, {
    message: 'Project retrieved successfully',
    data: { project },
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.user.id, req.params.id, req.body);
  sendSuccess(res, {
    message: 'Project updated successfully',
    data: { project },
  });
});

const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.user.id, req.params.id);
  sendSuccess(res, {
    message: 'Project deleted successfully',
  });
});

// ─── Members ────────────────────────────────────────────────────────────────

const addMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const member = await projectService.addMember(req.user.id, req.params.id, userId, role);
  sendSuccess(res, {
    message: 'Member added successfully',
    data: { member },
  });
});

const removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  await projectService.removeMember(req.user.id, req.params.id, userId);
  sendSuccess(res, {
    message: 'Member removed successfully',
  });
});

// ─── Share and Join ─────────────────────────────────────────────────────────

const generateShareLink = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Verify access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { workspace: true, members: true }
  });

  if (!project) throw new AppError('Project not found', 404);

  const isMember = project.members.some(m => m.userId === req.user.id);
  const isOwner = project.workspace.ownerId === req.user.id;
  if (!isMember && !isOwner) throw new AppError('Not authorized', 403);

  // Generate 6-char alphanumeric code if not exists
  let joinCode = project.joinCode;
  if (!joinCode) {
    joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    await prisma.project.update({
      where: { id: projectId },
      data: { joinCode }
    });
  }

  const text = encodeURIComponent(`Join my CodeSync workspace! Enter code: ${joinCode}`);
  const whatsappUrl = `https://wa.me/?text=${text}`;

  sendSuccess(res, {
    message: 'Share link generated',
    data: { joinCode, whatsappUrl }
  });
});

const joinByCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw new AppError('Join code is required', 400);

  const project = await prisma.project.findUnique({
    where: { joinCode: code },
    include: { members: true }
  });

  if (!project) throw new AppError('Invalid join code', 404);

  const isMember = project.members.some(m => m.userId === req.user.id);
  
  if (!isMember) {
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: req.user.id,
        role: 'EDITOR' // Giving editor permissions as requested
      }
    });
  }

  sendSuccess(res, {
    message: 'Successfully joined project',
    data: { projectId: project.id }
  });
});

module.exports = {
  createProject,
  getProjectsByWorkspace,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  generateShareLink,
  joinByCode,
};
