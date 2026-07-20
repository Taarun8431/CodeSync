'use strict';

const { WebSocketServer } = require('ws');
const { setupWSConnection, setPersistence, docs } = require('y-websocket/bin/utils');
const { verifyAccessToken } = require('./utils/jwt');
const prisma = require('./lib/prisma');

// ─── WebSocket Rate Limiting (DoS Prevention) ────────────────────────────────
const wsConnectionCounts = new Map();

// Clear the connection counts every 1 minute
setInterval(() => {
  wsConnectionCounts.clear();
}, 60000);

// ─── Auto-Save Loop (Every 2 Minutes) ────────────────────────────────────────
setInterval(() => {
  docs.forEach(async (ydoc, docName) => {
    try {
      if (docName.startsWith('project-')) {
        const chatArray = ydoc.getArray('chat').toArray();
        await prisma.project.update({
          where: { id: docName.replace('project-', '') },
          data: { chatHistory: chatArray }
        });
      } else {
        const content = ydoc.getText('monaco').toString();
        await prisma.file.update({
          where: { id: docName },
          data: { content }
        });
        
        // Broadcast notification to all connected clients editing this file
        const notifMap = ydoc.getMap('notifications');
        notifMap.set('lastSaved', Date.now());
      }
    } catch (err) {
      console.error(`[AutoSave] Failed to save ${docName}:`, err.message);
    }
  });
}, 120000);

// ─── Database Persistence (Debounced Saves) ──────────────────────────────────
// This binds the Yjs in-memory document to our Postgres Database

setPersistence({
  bindState: async (docName, ydoc) => {
    try {
      if (docName.startsWith('project-')) {
        // Project-level document (for Chat)
        const projectId = docName.replace('project-', '');
        console.log(`[Yjs] Loading chat state for project: ${projectId}`);
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        
        if (project && project.chatHistory) {
          const yarray = ydoc.getArray('chat');
          if (yarray.length === 0) {
            yarray.insert(0, typeof project.chatHistory === 'string' ? JSON.parse(project.chatHistory) : project.chatHistory);
          }
        }
      } else {
        // File-level document (for Code Editing)
        console.log(`[Yjs] Loading initial state for file: ${docName}`);
        const file = await prisma.file.findUnique({ where: { id: docName } });
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
  writeState: async (docName, ydoc) => {
    try {
      if (docName.startsWith('project-')) {
        const projectId = docName.replace('project-', '');
        const chatArray = ydoc.getArray('chat').toArray();
        await prisma.project.update({
          where: { id: projectId },
          data: { chatHistory: chatArray }
        });
        console.log(`[Yjs] Successfully saved chat for project ${projectId} to DB`);
      } else {
        const content = ydoc.getText('monaco').toString();
        await prisma.file.update({
          where: { id: docName },
          data: { content }
        });
        console.log(`[Yjs] Successfully saved file ${docName} to DB`);
      }
    } catch (err) {
      console.error(`[Yjs] Failed to save ${docName} to DB:`, err.message);
    }
  }
});

// Custom authentication for WebSocket connections
const authenticateWS = async (req) => {
  // Try to get token from query param (e.g. ?token=...)
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');

  if (!token) throw new Error('Authentication token required');

  const decoded = verifyAccessToken(token);
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  
  if (!user) throw new Error('User not found');
  return user;
};

const setupSockets = (server) => {
  // Create a native WebSocket server attached to the HTTP server.
  // We use noServer: true because we want to intercept the upgrade request to perform authentication.
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    // Basic IP throttling
    const ip = request.socket.remoteAddress;
    const count = wsConnectionCounts.get(ip) || 0;
    
    // Allow max 20 websocket connection attempts per minute per IP
    if (count > 20 && process.env.NODE_ENV !== 'development') {
      socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
      socket.destroy();
      return;
    }
    wsConnectionCounts.set(ip, count + 1);

    // Only handle WebSocket requests aimed at the collaborative editor
    if (request.url.startsWith('/api/v1/collaboration/')) {
      try {
        // Authenticate the user before upgrading
        const user = await authenticateWS(request);
        request.user = user; // attach user to request for yjs awareness if needed
        
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } catch (err) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws, req) => {
    // Determine the document name from the URL (e.g. /api/collaboration/file-uuid)
    const url = new URL(req.url, 'http://localhost');
    const docName = url.pathname.split('/').pop();

    // Log the connection
    console.log(`[WebSocket] Client connected to document: ${docName}`);

    // Setup the Yjs document synchronization and awareness over this WebSocket connection
    setupWSConnection(ws, req, { docName });

    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected from document: ${docName}`);
    });
  });

  return wss;
};

module.exports = setupSockets;
