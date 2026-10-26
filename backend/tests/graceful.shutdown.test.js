'use strict';

const Y = require('yjs');

jest.mock('../src/lib/prisma', () => ({
  file: {
    update: jest.fn(),
  },
  $disconnect: jest.fn(),
}));

const prisma = require('../src/lib/prisma');
const { flushAllDocumentsToDb, docs } = require('../src/socket');
const { shutdown } = require('../src/server');

describe('Emergency Crash Flush & Graceful Shutdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    docs.clear();
  });

  afterAll(() => {
    docs.clear();
  });

  describe('flushAllDocumentsToDb', () => {
    it('should return zeros when no documents are in memory', async () => {
      const result = await flushAllDocumentsToDb();
      expect(result).toEqual({ total: 0, saved: 0, failed: 0 });
      expect(prisma.file.update).not.toHaveBeenCalled();
    });

    it('should flush all active file documents to PostgreSQL before timeout', async () => {
      const fileId1 = 'file-uuid-1';
      const fileId2 = 'file-uuid-2';

      const ydoc1 = new Y.Doc();
      ydoc1.getText('monaco').insert(0, 'console.log("Hello from Doc 1");');
      docs.set(`file:${fileId1}`, ydoc1);

      const ydoc2 = new Y.Doc();
      ydoc2.getText('monaco').insert(0, 'def add(a, b):\n    return a + b');
      docs.set(`file:${fileId2}`, ydoc2);

      // Also add a non-file doc (chat doc) which should be ignored by file updater
      const chatDoc = new Y.Doc();
      docs.set('project-chat:proj-1', chatDoc);

      prisma.file.update.mockResolvedValue({});

      const result = await flushAllDocumentsToDb(3000);

      expect(result.total).toBe(2);
      expect(result.saved).toBe(2);
      expect(result.failed).toBe(0);

      expect(prisma.file.update).toHaveBeenCalledTimes(2);
      expect(prisma.file.update).toHaveBeenCalledWith({
        where: { id: fileId1 },
        data: { content: 'console.log("Hello from Doc 1");' },
      });
      expect(prisma.file.update).toHaveBeenCalledWith({
        where: { id: fileId2 },
        data: { content: 'def add(a, b):\n    return a + b' },
      });
    });

    it('should handle partial DB failures gracefully without aborting other documents', async () => {
      const fileId1 = 'file-failing';
      const fileId2 = 'file-succeeding';

      const ydoc1 = new Y.Doc();
      ydoc1.getText('monaco').insert(0, 'Broken file update');
      docs.set(`file:${fileId1}`, ydoc1);

      const ydoc2 = new Y.Doc();
      ydoc2.getText('monaco').insert(0, 'Working file update');
      docs.set(`file:${fileId2}`, ydoc2);

      prisma.file.update
        .mockRejectedValueOnce(new Error('DB write failed'))
        .mockResolvedValueOnce({});

      const result = await flushAllDocumentsToDb(3000);

      expect(result.total).toBe(2);
      expect(result.saved).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('should handle timeout safeguard if database connection hangs', async () => {
      const fileId = 'file-slow';
      const ydoc = new Y.Doc();
      ydoc.getText('monaco').insert(0, 'Hanging query');
      docs.set(`file:${fileId}`, ydoc);

      // Hanging promise that never resolves
      prisma.file.update.mockImplementation(() => new Promise(() => {}));

      // Flush with a 50ms timeout
      const result = await flushAllDocumentsToDb(50);

      expect(result.timedOut).toBe(true);
      expect(result.saved).toBe(0);
    });
  });

  describe('shutdown function in server.js', () => {
    it('should disconnect prisma and flush documents on shutdown', async () => {
      prisma.$disconnect.mockResolvedValue();

      await shutdown('TEST_SIGNAL', 0);

      expect(prisma.$disconnect).toHaveBeenCalled();
    });

    it('should prevent re-entrant calls if shutdown is called multiple times', async () => {
      prisma.$disconnect.mockClear();

      // Second call should be ignored by the isShuttingDown guard
      await shutdown('TEST_SIGNAL_2', 0);

      expect(prisma.$disconnect).not.toHaveBeenCalled();
    });
  });
});
