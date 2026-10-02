'use strict';

/**
 * VFS Service Tests
 *
 * Tests cover:
 *   - createFile (success, duplicate name, VIEWER access denied)
 *   - createFolder (success, duplicate name)
 *   - getProjectTree (calls CTE query, returns folders + files)
 *   - RBAC enforcement (VIEWER cannot write)
 *   - updateFileContent (storage provider called correctly)
 */

jest.mock('../src/lib/prisma', () => ({
  project: {
    findUnique: jest.fn(),
  },
  folder: {
    findFirst:  jest.fn(),
    findMany:   jest.fn(),
    create:     jest.fn(),
    findUnique: jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
  },
  file: {
    findFirst:  jest.fn(),
    findMany:   jest.fn(),
    findUnique: jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
  },
  $queryRaw: jest.fn(),
}));

jest.mock('../src/utils/storage', () => ({
  read:  jest.fn().mockResolvedValue('file content from storage'),
  write: jest.fn().mockResolvedValue({ content: 'new content' }),
  isS3:  false,
}));

const prisma  = require('../src/lib/prisma');
const storage = require('../src/utils/storage');
const vfsService = require('../src/modules/vfs/services/vfs.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mockProject = (role = 'OWNER') => ({
  id:          'proj-123',
  isPublic:    false,
  workspace:   { ownerId: role === 'OWNER' ? 'user-123' : 'other-user' },
  members:     role === 'OWNER' ? [] : [{ userId: 'user-123', role }],
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── createFile ───────────────────────────────────────────────────────────────

describe('vfsService.createFile', () => {
  it('should create a file for an OWNER', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject('OWNER'));
    prisma.file.findFirst.mockResolvedValue(null); // no duplicate
    prisma.file.create.mockResolvedValue({ id: 'file-1', name: 'index.js', content: '' });

    const result = await vfsService.createFile('user-123', 'proj-123', {
      name: 'index.js',
      language: 'javascript',
    });

    expect(prisma.file.create).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('id', 'file-1');
  });

  it('should throw 409 if a file with the same name exists in the same folder', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject('OWNER'));
    prisma.file.findFirst.mockResolvedValue({ id: 'existing-file' }); // duplicate

    await expect(
      vfsService.createFile('user-123', 'proj-123', { name: 'index.js', language: 'javascript' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('should throw 403 if user is a VIEWER', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject('VIEWER'));

    await expect(
      vfsService.createFile('user-123', 'proj-123', { name: 'index.js', language: 'javascript' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('should allow an EDITOR to create a file', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject('EDITOR'));
    prisma.file.findFirst.mockResolvedValue(null);
    prisma.file.create.mockResolvedValue({ id: 'file-2', name: 'app.py', content: '' });

    const result = await vfsService.createFile('user-123', 'proj-123', {
      name: 'app.py',
      language: 'python',
    });

    expect(result).toHaveProperty('name', 'app.py');
  });
});

// ─── createFolder ─────────────────────────────────────────────────────────────

describe('vfsService.createFolder', () => {
  it('should create a root folder', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject('OWNER'));
    prisma.folder.findFirst.mockResolvedValue(null);
    prisma.folder.create.mockResolvedValue({ id: 'folder-1', name: 'src', parentId: null });

    const result = await vfsService.createFolder('user-123', 'proj-123', { name: 'src' });

    expect(result).toHaveProperty('name', 'src');
    expect(prisma.folder.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ name: 'src', parentId: null }),
    }));
  });

  it('should throw 409 on duplicate folder name in same parent', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject('OWNER'));
    prisma.folder.findFirst.mockResolvedValue({ id: 'existing-folder' });

    await expect(
      vfsService.createFolder('user-123', 'proj-123', { name: 'src' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ─── getProjectTree ───────────────────────────────────────────────────────────

describe('vfsService.getProjectTree', () => {
  it('should call $queryRaw (recursive CTE) and findMany for files', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject('OWNER'));
    prisma.$queryRaw.mockResolvedValue([
      { id: 'f1', name: 'src', parentId: null, depth: 0 },
      { id: 'f2', name: 'components', parentId: 'f1', depth: 1 },
    ]);
    prisma.file.findMany.mockResolvedValue([
      { id: 'file-1', name: 'index.js', folderId: 'f1' },
    ]);

    const result = await vfsService.getProjectTree('user-123', 'proj-123');

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1); // CTE query fired
    expect(result.folders).toHaveLength(2);
    expect(result.files).toHaveLength(1);
  });
});

// ─── updateFileContent ────────────────────────────────────────────────────────

describe('vfsService.updateFileContent', () => {
  it('should call storage.write and update the file in DB with the returned patch', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject('OWNER'));
    prisma.file.findFirst.mockResolvedValue({ id: 'file-1', projectId: 'proj-123' });
    storage.write.mockResolvedValue({ content: 'updated content' });
    prisma.file.update.mockResolvedValue({ id: 'file-1', content: 'updated content' });

    await vfsService.updateFileContent('user-123', 'proj-123', 'file-1', 'updated content');

    expect(storage.write).toHaveBeenCalledWith('file-1', 'updated content');
    expect(prisma.file.update).toHaveBeenCalledWith({
      where: { id: 'file-1' },
      data: { content: 'updated content' },
    });
  });
});

// ─── Security & Authorization Tests (IDOR & RBAC) ─────────────────────────────

describe('vfsService RBAC & IDOR Protections', () => {
  it('should reject write actions by public non-members (read-only enforcement)', async () => {
    // Project is public, but user is not owner and not member
    prisma.project.findUnique.mockResolvedValue({
      id: 'proj-public',
      isPublic: true,
      workspace: { ownerId: 'other-owner' },
      members: [],
    });

    await expect(
      vfsService.createFile('non-member-123', 'proj-public', { name: 'test.js' })
    ).rejects.toMatchObject({ statusCode: 403 });

    await expect(
      vfsService.createFolder('non-member-123', 'proj-public', { name: 'docs' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('should prevent VFS IDOR when reading a file belonging to another project', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject('OWNER'));
    // file exists, but NOT in proj-123 (findFirst returns null)
    prisma.file.findFirst.mockResolvedValue(null);

    await expect(
      vfsService.getFileContent('user-123', 'proj-123', 'other-project-file-id')
    ).rejects.toMatchObject({ statusCode: 404, message: 'File not found in this project' });
  });

  it('should prevent VFS IDOR when updating or deleting a file from another project', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject('OWNER'));
    prisma.file.findFirst.mockResolvedValue(null);

    await expect(
      vfsService.updateFileContent('user-123', 'proj-123', 'foreign-file-id', 'hacked')
    ).rejects.toMatchObject({ statusCode: 404, message: 'File not found in this project' });

    await expect(
      vfsService.deleteFile('user-123', 'proj-123', 'foreign-file-id')
    ).rejects.toMatchObject({ statusCode: 404, message: 'File not found in this project' });
  });

  it('should prevent VFS IDOR when modifying or deleting a folder from another project', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject('OWNER'));
    prisma.folder.findFirst.mockResolvedValue(null);

    await expect(
      vfsService.renameFolder('user-123', 'proj-123', 'foreign-folder-id', 'new-name')
    ).rejects.toMatchObject({ statusCode: 404, message: 'Folder not found in this project' });

    await expect(
      vfsService.deleteFolder('user-123', 'proj-123', 'foreign-folder-id')
    ).rejects.toMatchObject({ statusCode: 404, message: 'Folder not found in this project' });
  });
});
