'use strict';

/**
 * WebSocket Resource-level Authorization Tests
 *
 * Tests cover:
 *   - Chat access: Workspace Owner (granted)
 *   - Chat access: Project Member with EDITOR/VIEWER (granted)
 *   - Chat access: Public project non-member (granted read-only)
 *   - Chat access: Private project non-member (rejected 403)
 *   - Chat access: Non-existent project (rejected 404)
 *   - File access: Workspace Owner (granted EDITOR/write)
 *   - File access: Project Member with EDITOR (granted write)
 *   - File access: Project Member with VIEWER (granted read-only)
 *   - File access: Public project non-member (granted read-only)
 *   - File access: Unauthorized non-member (rejected 403)
 *   - File access: Non-existent file (rejected 404)
 */

jest.mock('../src/lib/prisma', () => ({
  project: {
    findUnique: jest.fn(),
  },
  file: {
    findUnique: jest.fn(),
  },
}));

const prisma = require('../src/lib/prisma');
const { authorizeDocumentAccess, enforceReadOnlySocket } = require('../src/socket');
const encoding = require('lib0/dist/encoding.cjs');
const syncProtocol = require('y-protocols/dist/sync.cjs');
const EventEmitter = require('events');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('WebSocket Resource Authorization (authorizeDocumentAccess)', () => {
  describe('Chat Document Authorization', () => {
    it('should grant access to workspace owner', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        isPublic: false,
        workspace: { ownerId: 'user-owner' },
        members: [],
      });

      const res = await authorizeDocumentAccess('user-owner', { type: 'chat', projectId: 'proj-1' });
      expect(res.role).toBe('OWNER');
      expect(res.isReadOnly).toBe(false);
    });

    it('should grant access to a project member', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        isPublic: false,
        workspace: { ownerId: 'other-user' },
        members: [{ userId: 'user-member', role: 'EDITOR' }],
      });

      const res = await authorizeDocumentAccess('user-member', { type: 'chat', projectId: 'proj-1' });
      expect(res.role).toBe('EDITOR');
      expect(res.isReadOnly).toBe(false);
    });

    it('should grant read-only access to non-member if project is public', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        isPublic: true,
        workspace: { ownerId: 'other-user' },
        members: [],
      });

      const res = await authorizeDocumentAccess('user-guest', { type: 'chat', projectId: 'proj-1' });
      expect(res.role).toBe('PUBLIC_VIEWER');
      expect(res.isReadOnly).toBe(true);
    });

    it('should reject non-member with 403 if project is private', async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        isPublic: false,
        workspace: { ownerId: 'other-user' },
        members: [],
      });

      await expect(
        authorizeDocumentAccess('intruder-user', { type: 'chat', projectId: 'proj-1' })
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('should reject with 404 if project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        authorizeDocumentAccess('user-1', { type: 'chat', projectId: 'non-existent' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('File Document Authorization', () => {
    it('should grant access to file for project member', async () => {
      prisma.file.findUnique.mockResolvedValue({
        id: 'file-1',
        projectId: 'proj-1',
        project: {
          id: 'proj-1',
          isPublic: false,
          workspace: { ownerId: 'owner-id' },
          members: [{ userId: 'user-editor', role: 'EDITOR' }],
        },
      });

      const res = await authorizeDocumentAccess('user-editor', { type: 'file', fileId: 'file-1' });
      expect(res.role).toBe('EDITOR');
      expect(res.isReadOnly).toBe(false);
    });

    it('should grant read-only access for VIEWER member', async () => {
      prisma.file.findUnique.mockResolvedValue({
        id: 'file-1',
        projectId: 'proj-1',
        project: {
          id: 'proj-1',
          isPublic: false,
          workspace: { ownerId: 'owner-id' },
          members: [{ userId: 'user-viewer', role: 'VIEWER' }],
        },
      });

      const res = await authorizeDocumentAccess('user-viewer', { type: 'file', fileId: 'file-1' });
      expect(res.role).toBe('VIEWER');
      expect(res.isReadOnly).toBe(true);
    });

    it('should reject file access with 403 for unauthorized user', async () => {
      prisma.file.findUnique.mockResolvedValue({
        id: 'file-1',
        projectId: 'proj-1',
        project: {
          id: 'proj-1',
          isPublic: false,
          workspace: { ownerId: 'owner-id' },
          members: [],
        },
      });

      await expect(
        authorizeDocumentAccess('unauthorized-user', { type: 'file', fileId: 'file-1' })
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('should reject with 404 for non-existent file', async () => {
      prisma.file.findUnique.mockResolvedValue(null);

      await expect(
        authorizeDocumentAccess('user-1', { type: 'file', fileId: 'missing-file' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('Read-Only WebSocket Mutation Blocking (enforceReadOnlySocket)', () => {
    let mockWs;
    let receivedEvents;

    beforeEach(() => {
      receivedEvents = [];
      mockWs = new EventEmitter();
      mockWs.send = jest.fn();
      mockWs.readyState = 1; // OPEN
    });

    it('should block messageYjsUpdate from read-only VIEWER clients', () => {
      enforceReadOnlySocket(mockWs, 'file:file-1', { username: 'viewerUser' }, { role: 'VIEWER', isReadOnly: true });

      mockWs.on('message', (msg) => {
        receivedEvents.push(msg);
      });

      // Construct a messageSync (0) + messageYjsUpdate (2)
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, 0); // messageSync
      syncProtocol.writeUpdate(encoder, new Uint8Array([42, 43, 44]));
      const updateMsg = encoding.toUint8Array(encoder);

      // Trigger message
      mockWs.emit('message', updateMsg);

      // Listener must NEVER receive the update
      expect(receivedEvents).toHaveLength(0);
    });

    it('should block messageYjsSyncStep2 mutations from read-only VIEWER clients', () => {
      enforceReadOnlySocket(mockWs, 'file:file-1', { username: 'viewerUser' }, { role: 'VIEWER', isReadOnly: true });

      mockWs.on('message', (msg) => {
        receivedEvents.push(msg);
      });

      // Construct a messageSync (0) + messageYjsSyncStep2 (1)
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, 0); // messageSync
      encoding.writeVarUint(encoder, 1); // syncStep2
      encoding.writeVarUint8Array(encoder, new Uint8Array([1, 2, 3]));
      const syncStep2Msg = encoding.toUint8Array(encoder);

      mockWs.emit('message', syncStep2Msg);

      // Must be dropped
      expect(receivedEvents).toHaveLength(0);
    });

    it('should allow messageYjsSyncStep1 through so read-only clients can receive document state', () => {
      enforceReadOnlySocket(mockWs, 'file:file-1', { username: 'viewerUser' }, { role: 'VIEWER', isReadOnly: true });

      mockWs.on('message', (msg) => {
        receivedEvents.push(msg);
      });

      // Construct a messageSync (0) + messageYjsSyncStep1 (0)
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, 0); // messageSync
      encoding.writeVarUint(encoder, 0); // syncStep1
      encoding.writeVarUint8Array(encoder, new Uint8Array([0]));
      const syncStep1Msg = encoding.toUint8Array(encoder);

      mockWs.emit('message', syncStep1Msg);

      // Must be delivered so server can respond with document state
      expect(receivedEvents).toHaveLength(1);
    });

    it('should allow messageAwareness through for presence and viewing state', () => {
      enforceReadOnlySocket(mockWs, 'file:file-1', { username: 'viewerUser' }, { role: 'VIEWER', isReadOnly: true });

      mockWs.on('message', (msg) => {
        receivedEvents.push(msg);
      });

      // Construct a messageAwareness (1)
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, 1); // messageAwareness
      encoding.writeVarUint8Array(encoder, new Uint8Array([99]));
      const awarenessMsg = encoding.toUint8Array(encoder);

      mockWs.emit('message', awarenessMsg);

      // Must be delivered
      expect(receivedEvents).toHaveLength(1);
    });
  });
});
