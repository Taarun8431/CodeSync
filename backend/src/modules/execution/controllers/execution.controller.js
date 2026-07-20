'use strict';

const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const AppError = require('../../../utils/AppError');
const prisma = require('../../../lib/prisma');
const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const util = require('util');

const execPromise = util.promisify(exec);

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

  // 3. Local execution configurations
  const langMap = {
    javascript: { ext: 'js', cmd: 'node' },
    python: { ext: 'py', cmd: 'python' }
    // Other languages require compilation steps (gcc, javac) which can be added later
  };

  const langConfig = langMap[language.toLowerCase()];
  if (!langConfig) {
    throw new AppError(`Language '${language}' is not currently supported on the local engine. Try Javascript or Python.`, 400);
  }

  // 4. Create temporary execution environment
  const os = require('os');
  const tempDir = path.join(os.tmpdir(), 'codesync_executions');
  await fs.mkdir(tempDir, { recursive: true }).catch(() => {});
  
  const fileName = crypto.randomBytes(16).toString('hex') + '.' + langConfig.ext;
  const filePath = path.join(tempDir, fileName);
  
  await fs.writeFile(filePath, contentToRun);
  
  // 5. Execute Code using Node child_process
  try {
    const { stdout, stderr } = await execPromise(`${langConfig.cmd} ${filePath}`, { timeout: 5000 });
    
    await fs.unlink(filePath).catch(() => {}); // Cleanup
    
    sendSuccess(res, {
      message: 'Code executed successfully locally',
      data: {
        language,
        version: 'local-engine v1.0',
        run: { stdout, stderr, code: 0 }
      }
    });
  } catch (err) {
    await fs.unlink(filePath).catch(() => {}); // Cleanup
    
    sendSuccess(res, {
      message: 'Code executed with errors',
      data: {
        language,
        version: 'local-engine v1.0',
        run: { 
          stdout: err.stdout || '', 
          stderr: err.stderr || err.message, 
          code: err.code || 1 
        }
      }
    });
  }
});

module.exports = {
  executeCode,
};
