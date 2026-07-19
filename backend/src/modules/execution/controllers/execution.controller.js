'use strict';

const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const AppError = require('../../../utils/AppError');
const prisma = require('../../../lib/prisma');

// Helper to check user has at least viewer access to the project
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
};

const executeCode = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { fileId, code, language = 'javascript' } = req.body;

  // 1. Verify access
  await verifyProjectAccess(req.user.id, projectId);

  let contentToRun = code;

  // 2. Fetch code from DB if fileId is provided and no raw code is sent
  if (fileId && !contentToRun) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.projectId !== projectId) {
      throw new AppError('File not found in this project', 404);
    }
    contentToRun = file.content;
  }

  if (!contentToRun) {
    throw new AppError('No code provided to execute', 400);
  }

  // 3. Map common editor language identifiers to Piston API identifiers
  const langMap = {
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    java: 'java',
    cpp: 'c++',
    c: 'c',
    rust: 'rust',
    go: 'go',
    php: 'php'
  };

  const pistonLang = langMap[language.toLowerCase()] || language;

  // 4. Make request to public Piston API
  const response = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: pistonLang,
      version: '*', // Ask Piston for latest available version
      files: [{ content: contentToRun }]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new AppError(data.message || 'Failed to execute code on remote engine', 500);
  }

  // 5. Return execution results
  sendSuccess(res, {
    message: 'Code executed successfully',
    data: {
      language: data.language,
      version: data.version,
      run: data.run // contains stdout, stderr, code, signal
    }
  });
});

module.exports = {
  executeCode,
};
