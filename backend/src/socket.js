'use strict';

/**
 * WebSocket Server — Real-time Collaboration Hub
 *
 * Tech Stack:
 *   - ws           : Native WebSocket server (RFC 6455 full-duplex)
 *   - y-websocket  : Yjs CRDT sync protocol over WebSocket
 *   - yjs          : The CRDT library (Y.Doc, Y.Text, Y.Array, Y.Map)
 *
 * Document Naming Convention:
 *   1. "project-chat:<projectId>" — project-level doc (chat messages via Y.Array)
 *   2. "file:<fileId>"             — file-level doc (code via Y.Text named 'monaco')
 *   (Legacy formats supported via parseDocName fallback)
 *
 * Security & Authorization Pipeline:
 *   HTTP Upgrade Request
 *         ↓
 *   1. Rate Limiting (IP throttle)
 *         ↓
 *   2. JWT Authentication (verify token & user existence)
 *         ↓
 *   3. Identify Document (parseDocName -> chat/file + resource ID)
 *         ↓
 *   4. Find File / Project (verify resource existence in DB)
 *         ↓
 *   5. Check Membership / Ownership / Public Access (reject 403 if unauthorized)
 *         ↓
 *   6. Check EDITOR / VIEWER permission (attach role & isReadOnly)
 *         ↓
 *   7. Allow WebSocket Upgrade & setup Yjs CRDT connection
 */

const { WebSocketServer } = require('ws');
const { setupWSConnection, setPersistence, docs } = require('y-websocket/bin/utils');
const { verifyAccessToken } = require('./utils/jwt');
const { parseDocName } = require('./utils/docName');
const prisma = require('./lib/prisma');

// ─── Deterministic user color from username ───────────────────────────────────
const USER_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#22c55e',
  '#f59e0b', '#06b6d4', '#ef4444', '#a855f7',
  '#14b8a6', '#f97316',
];

const getUserColor = (username = '') => {
  let hash = 0;
  for (const ch of username) hash = (hash + ch.charCodeAt(0)) % USER_COLORS.length;
  return USER_COLORS[hash];
};

// ─── WebSocket Rate Limiting (DoS Prevention) ─────────────────────────────────
const wsConnectionCounts = new Map();
const rateLimitTimer = setInterval(() => wsConnectionCounts.clear(), 60000);
if (rateLimitTimer.unref) rateLimitTimer.unref();

// ─── Document-level Resource Authorization ────────────────────────────────────
const authorizeDocumentAccess = async (userId, parsedDoc) => {
  if (parsedDoc.type === 'chat') {
    const projectId = parsedDoc.projectId;
    if (!projectId) {
      const err = new Error('Project ID is required in chat document name');
      err.statusCode = 400;
      throw err;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true, workspace: true },
    });

    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    const isWorkspaceOwner = project.workspace?.ownerId === userId;
    const member = project.members?.find((m) => m.userId === userId);

    if (!isWorkspaceOwner && !member && !project.isPublic) {
      const err = new Error('Not authorized to access this project chat');
      err.statusCode = 403;
      throw err;
    }

    const role = isWorkspaceOwner ? 'OWNER' : member ? member.role : 'PUBLIC_VIEWER';
    return { project, role, isReadOnly: role !== 'OWNER' && role !== 'EDITOR' };
  }

  if (parsedDoc.type === 'file') {
    const fileId = parsedDoc.fileId;
    if (!fileId) {
      const err = new Error('File ID is required in file document name');
      err.statusCode = 400;
      throw err;
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        project: {
          include: { members: true, workspace: true },
        },
      },
    });

    if (!file || !file.project) {
      const err = new Error('File not found');
      err.statusCode = 404;
      throw err;
    }

    const project = file.project;
    const isWorkspaceOwner = project.workspace?.ownerId === userId;
    const member = project.members?.find((m) => m.userId === userId);

    if (!isWorkspaceOwner && !member && !project.isPublic) {
      const err = new Error('Not authorized to access this file');
      err.statusCode = 403;
      throw err;
    }

    const role = isWorkspaceOwner ? 'OWNER' : member ? member.role : 'PUBLIC_VIEWER';
    return { project, file, role, isReadOnly: role !== 'OWNER' && role !== 'EDITOR' };
  }

  const err = new Error('Invalid document type');
  err.statusCode = 400;
  throw err;
};

// ─── Auto-Save Loop (Every 2 Minutes) ─────────────────────────────────────────
const autoSaveTimer = setInterval(() => {
  docs.forEach(async (ydoc, docName) => {
    try {
      const parsed = parseDocName(docName);
      if (parsed.type === 'file' && parsed.fileId) {
        // File document — save the current Y.Text content to DB
        const content = ydoc.getText('monaco').toString();
        await prisma.file.update({
          where: { id: parsed.fileId },
          data: { content },
        });

        // Notify all connected clients that auto-save occurred
        const notifMap = ydoc.getMap('notifications');
        notifMap.set('lastSaved', Date.now());
      }
    } catch (err) {
      console.error(`[AutoSave] Failed to save ${docName}:`, err.message);
    }
  });
}, 120000);
if (autoSaveTimer.unref) autoSaveTimer.unref();

// ─── Database Persistence Hook ────────────────────────────────────────────────
setPersistence({
  /**
   * bindState — Called when the FIRST client connects to a Y.Doc.
   * Loads existing data from DB into the in-memory Yjs document.
   */
  bindState: async (docName, ydoc) => {
    try {
      const parsed = parseDocName(docName);

      if (parsed.type === 'chat') {
        const projectId = parsed.projectId;
        console.log(`[Yjs] Loading chat state for project: ${projectId}`);

        // Load last 200 messages ordered by timestamp ascending
        const messages = await prisma.chatMessage.findMany({
          where: { projectId },
          orderBy: { timestamp: 'asc' },
          take: 200,
        });

        const chatArray = ydoc.getArray('chat');
        if (chatArray.length === 0 && messages.length > 0) {
          // Hydrate the Y.Array with DB messages
          chatArray.insert(0, messages.map((m) => ({
            user:      m.username,
            text:      m.text,
            timestamp: m.timestamp.getTime(),
          })));
        }

        // Observe new chat messages pushed by clients and persist each one to DB
        if (!ydoc._chatObserverAttached) {
          ydoc._chatObserverAttached = true;
          chatArray.observe(async (event) => {
            if (event.changes.added.size === 0) return;
            for (const item of event.changes.added) {
              for (const msg of item.content.getContent()) {
                try {
                  await prisma.chatMessage.create({
                    data: {
                      projectId,
                      username:  msg.user || 'Unknown',
                      text:      msg.text || '',
                      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
                    },
                  });
                } catch (dbErr) {
                  console.error('[Chat] Failed to persist message:', dbErr.message);
                }
              }
            }
          });
        }

      } else if (parsed.type === 'file') {
        const fileId = parsed.fileId;
        console.log(`[Yjs] Loading initial state for file: ${fileId}`);
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if (file && file.content) {
          const ytext = ydoc.getText('monaco');
          if (ytext.length === 0) {
            ytext.insert(0, file.content);
          }
        }
      }
    } catch (err) {
      console.error(`[Yjs] Failed to load ${docName}:`, err.message);
    }
  },

  /**
   * writeState — Called when the LAST client disconnects from a Y.Doc.
   * Final flush of data to DB before the in-memory doc is evicted.
   */
  writeState: async (docName, ydoc) => {
    try {
      const parsed = parseDocName(docName);
      if (parsed.type === 'file' && parsed.fileId) {
        const content = ydoc.getText('monaco').toString();
        await prisma.file.update({
          where: { id: parsed.fileId },
          data: { content },
        });
        console.log(`[Yjs] Final save for file ${parsed.fileId}`);
      }
    } catch (err) {
      console.error(`[Yjs] Failed to save ${docName} on disconnect:`, err.message);
    }
  },
});

// ─── JWT Authentication for WebSocket Upgrade ────────────────────────────────
const authenticateWS = async (req) => {
  // Browsers cannot set custom headers during WebSocket handshake (RFC limitation).
  // We pass the JWT as a URL query param: ?token=<accessToken>
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');

  if (!token) {
    const err = new Error('Authentication token required');
    err.statusCode = 401;
    throw err;
  }

  const decoded = verifyAccessToken(token);
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 401;
    throw err;
  }
  return user;
};

// ─── Setup Function ───────────────────────────────────────────────────────────
const setupSockets = (server) => {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    // IP-based throttle: max 30 WS attempts per minute per IP
    const ip = request.socket.remoteAddress;
    const count = wsConnectionCounts.get(ip) || 0;

    if (count > 30 && process.env.NODE_ENV !== 'development') {
      socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
      socket.destroy();
      return;
    }
    wsConnectionCounts.set(ip, count + 1);

    // Only handle collaboration WebSocket paths
    if (!request.url.startsWith('/api/v1/collaboration/')) {
      socket.destroy();
      return;
    }

    try {
      // 1. Authenticate user via JWT
      const user = await authenticateWS(request);

      // 2. Identify Document
      const url = new URL(request.url, 'http://localhost');
      const rawDocName = url.pathname.split('/').pop();
      if (!rawDocName) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      const docName = decodeURIComponent(rawDocName);
      const parsedDoc = parseDocName(docName);

      // 3. Resource-level Authorization (Check ProjectMember / Owner / Public / Permissions)
      const authInfo = await authorizeDocumentAccess(user.id, parsedDoc);

      request.user = user;
      request.docName = docName;
      request.authInfo = authInfo;

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } catch (err) {
      console.warn(`[WebSocket] Upgrade rejected: ${err.message} (${err.statusCode || 401})`);
      const statusMap = {
        400: 'HTTP/1.1 400 Bad Request\r\n\r\n',
        401: 'HTTP/1.1 401 Unauthorized\r\n\r\n',
        403: 'HTTP/1.1 403 Forbidden\r\n\r\n',
        404: 'HTTP/1.1 404 Not Found\r\n\r\n',
      };
      const responseLine = statusMap[err.statusCode] || 'HTTP/1.1 401 Unauthorized\r\n\r\n';
      socket.write(responseLine);
      socket.destroy();
    }
  });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const docName = req.docName || decodeURIComponent(url.pathname.split('/').pop());
    const user = req.user;
    const authInfo = req.authInfo;

    console.log(`[WebSocket] ${user?.username} (${authInfo?.role || 'VIEWER'}) connected to: ${docName}`);

    // Setup Yjs CRDT sync over this WebSocket connection
    setupWSConnection(ws, req, { docName });

    ws.on('close', () => {
      console.log(`[WebSocket] ${user?.username} disconnected from: ${docName}`);
    });
  });

  return wss;
};

module.exports = setupSockets;
module.exports.authorizeDocumentAccess = authorizeDocumentAccess;
