'use strict';

/**
 * Code Execution Controller
 *
 * Two execution engines (selected via USE_PISTON env var):
 *
 * 1. Piston API (USE_PISTON=true, RECOMMENDED)
 *    - Public API: https://emkc.org/api/v2/piston
 *    - No API key required
 *    - Runs code in isolated Docker containers (sandboxed)
 *    - Supports 50+ languages (javascript, python, cpp, java, go, rust, etc.)
 *    - No code can touch the host filesystem or make external requests
 *
 * 2. Local Engine (USE_PISTON=false, fallback for offline dev)
 *    - Uses Node.js child_process.exec
 *    - UNSAFE: runs with the server's OS privileges
 *    - Only supports javascript & python (whatever is installed on the server)
 *    - 5-second timeout prevents infinite loops
 */

const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../utils/apiResponse');
const AppError = require('../../../utils/AppError');
const prisma = require('../../../lib/prisma');

const USE_PISTON = process.env.USE_PISTON === 'true'; // default false: local node / python with timeout

// ─── Authorization Helper ────────────────────────────────────────────────────
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

// ─── Piston API Language Map ─────────────────────────────────────────────────
// Maps our internal language names → Piston language + version aliases
const PISTON_LANG_MAP = {
  javascript: { language: 'javascript', version: '18.15.0' },
  python:     { language: 'python',     version: '3.10.0'  },
  cpp:        { language: 'c++',        version: '10.2.0'  },
  c:          { language: 'c',          version: '10.2.0'  },
  java:       { language: 'java',       version: '15.0.2'  },
  go:         { language: 'go',         version: '1.16.2'  },
  rust:       { language: 'rust',       version: '1.50.0'  },
  typescript: { language: 'typescript', version: '5.0.3'   },
  bash:       { language: 'bash',       version: '5.2.0'   },
  ruby:       { language: 'ruby',       version: '3.0.1'   },
};

// ─── Piston Execution ────────────────────────────────────────────────────────
const executeWithPiston = async (code, language) => {
  const langConfig = PISTON_LANG_MAP[language.toLowerCase()];
  if (!langConfig) {
    throw new AppError(
      `Language '${language}' is not supported. Supported: ${Object.keys(PISTON_LANG_MAP).join(', ')}`,
      400
    );
  }

  const PISTON_API = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';

  const payload = {
    language: langConfig.language,
    version: langConfig.version,
    files: [{ content: code }],
    stdin: '',
    args: [],
    compile_timeout: 10000,
    run_timeout: 5000,
    compile_memory_limit: -1,
    run_memory_limit: -1,
  };

  const response = await fetch(`${PISTON_API}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000), // 15s total timeout (includes network)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new AppError(`Piston API error (${response.status}): ${errorText}`, 502);
  }

  const result = await response.json();

  // Piston returns { run: { stdout, stderr, code, signal } }
  return {
    engine: 'piston',
    language: result.language,
    version: result.version,
    run: {
      stdout: result.run?.stdout || '',
      stderr: result.run?.stderr || '',
      code: result.run?.code ?? 0,
    },
  };
};

// ─── Local Execution (Fallback) ──────────────────────────────────────────────
const executeLocally = async (code, language) => {
  const { exec } = require('child_process');
  const fs = require('fs/promises');
  const path = require('path');
  const crypto = require('crypto');
  const util = require('util');
  const os = require('os');

  const execPromise = util.promisify(exec);

  const localLangMap = {
    javascript: { ext: 'js', cmd: 'node' },
    python:     { ext: 'py', cmd: 'python' },
  };

  const langConfig = localLangMap[language.toLowerCase()];
  if (!langConfig) {
    throw new AppError(
      `Local engine only supports javascript and python. Set USE_PISTON=true for more languages.`,
      400
    );
  }

  const tempDir = path.join(os.tmpdir(), 'codesync_executions');
  await fs.mkdir(tempDir, { recursive: true }).catch(() => {});

  const fileName = crypto.randomBytes(16).toString('hex') + '.' + langConfig.ext;
  const filePath = path.join(tempDir, fileName);

  await fs.writeFile(filePath, code);

  try {
    const { stdout, stderr } = await execPromise(`${langConfig.cmd} "${filePath}"`, { timeout: 5000 });
    return {
      engine: 'local',
      language,
      version: 'local-engine',
      run: { stdout, stderr, code: 0 },
    };
  } catch (err) {
    return {
      engine: 'local',
      language,
      version: 'local-engine',
      run: {
        stdout: err.stdout || '',
        stderr: err.stderr || err.message,
        code: err.code || 1,
      },
    };
  } finally {
    await fs.unlink(filePath).catch(() => {});
  }
};

// ─── Controller ──────────────────────────────────────────────────────────────
const executeCode = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { fileId, code, language = 'javascript' } = req.body;

  // 1. Verify the user can access this project
  await verifyProjectAccess(req.user.id, projectId);

  let contentToRun = code;

  // 2. If no raw code sent, fetch from DB by fileId
  if (fileId && !contentToRun) {
    const file = await prisma.file.findFirst({ where: { id: fileId, projectId } });
    if (!file) {
      throw new AppError('File not found in this project', 404);
    }
    contentToRun = file.content;
  }

  if (!contentToRun) {
    throw new AppError('No code provided to execute', 400);
  }

  // 3. Execute via the selected engine
  const result = USE_PISTON
    ? await executeWithPiston(contentToRun, language)
    : await executeLocally(contentToRun, language);

  sendSuccess(res, {
    message: result.run.code === 0 ? 'Code executed successfully' : 'Code executed with errors',
    data: result,
  });
});

module.exports = { executeCode };
