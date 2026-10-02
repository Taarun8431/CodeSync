'use strict';

/**
 * VFS (Virtual File System) Service
 *
 * Implements a hierarchical file system inside PostgreSQL:
 *   - Folders use an Adjacency List model (parentId → children, self-referential)
 *   - Files have optional folderId (null = root of project)
 *   - Cascade delete: deleting a folder removes all nested folders + files
 *
 * Authorization:
 *   - verifyProjectAccess: checks membership, workspace ownership, or isPublic
 *   - verifyWriteAccess:   additionally rejects VIEWER role for mutating ops
 *
 * Tree Query Strategy:
 *   - Uses a PostgreSQL Recursive CTE to fetch the full folder tree in one
 *     round-trip, ordered by depth and then name (proper tree traversal order).
 *   - Files are fetched flat (no content) in a separate query for simplicity.
 *   - Content excluded from tree to avoid loading potentially huge blobs.
 *
 * Storage Abstraction:
 *   - getFileContent uses storage.read(file)  → DB content or S3 fetch
 *   - updateFileContent uses storage.write()  → DB update or S3 PutObject
 *   - Controlled by USE_S3 env var (default: false → keep in DB)
 */

const prisma = require('../../../lib/prisma');
const AppError = require('../../../utils/AppError');
const storage = require('../../../utils/storage');

// ─── Authorization Helpers ────────────────────────────────────────────────────

const verifyProjectAccess = async (userId, projectId) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true, workspace: true },
  });

  if (!project) throw new AppError('Project not found', 404);

  const isWorkspaceOwner = project.workspace.ownerId === userId;
  const member = project.members.find((m) => m.userId === userId);

  if (!member && !isWorkspaceOwner && !project.isPublic) {
    throw new AppError('Not authorized to access this project', 403);
  }

  // Explicit role determination:
  // - Workspace Owner: 'OWNER'
  // - Project Member: 'OWNER', 'EDITOR', or 'VIEWER'
  // - Public non-member: 'PUBLIC_VIEWER' (strictly read-only)
  const role = isWorkspaceOwner
    ? 'OWNER'
    : member
      ? member.role
      : 'PUBLIC_VIEWER';

  return { project, role };
};

const verifyWriteAccess = async (userId, projectId) => {
  const { role } = await verifyProjectAccess(userId, projectId);
  
  // Explicit whitelist: ONLY OWNER and EDITOR have write privileges
  if (role !== 'OWNER' && role !== 'EDITOR') {
    throw new AppError('Write permission required. You have read-only access to this project.', 403);
  }
};

// ─── Folders ──────────────────────────────────────────────────────────────────

const createFolder = async (userId, projectId, data) => {
  await verifyWriteAccess(userId, projectId);

  if (data.parentId) {
    const parentFolder = await prisma.folder.findFirst({
      where: { id: data.parentId, projectId },
    });
    if (!parentFolder) throw new AppError('Parent folder not found in this project', 404);
  }

  const existing = await prisma.folder.findFirst({
    where: { projectId, parentId: data.parentId || null, name: data.name },
  });
  if (existing) throw new AppError('Folder with this name already exists in this directory', 409);

  return prisma.folder.create({
    data: {
      name: data.name,
      projectId,
      parentId: data.parentId || null,
    },
  });
};

const renameFolder = async (userId, projectId, folderId, newName) => {
  await verifyWriteAccess(userId, projectId);

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, projectId },
  });
  if (!folder) throw new AppError('Folder not found in this project', 404);

  const existing = await prisma.folder.findFirst({
    where: { projectId, parentId: folder.parentId, name: newName },
  });
  if (existing && existing.id !== folderId) throw new AppError('Folder with this name already exists', 409);

  return prisma.folder.update({ where: { id: folderId }, data: { name: newName } });
};

const deleteFolder = async (userId, projectId, folderId) => {
  await verifyWriteAccess(userId, projectId);

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, projectId },
  });
  if (!folder) throw new AppError('Folder not found in this project', 404);

  await prisma.folder.delete({ where: { id: folderId } });
};

// ─── Files ────────────────────────────────────────────────────────────────────

const createFile = async (userId, projectId, data) => {
  await verifyWriteAccess(userId, projectId);

  if (data.folderId) {
    const folder = await prisma.folder.findFirst({
      where: { id: data.folderId, projectId },
    });
    if (!folder) throw new AppError('Folder not found in this project', 404);
  }

  const existing = await prisma.file.findFirst({
    where: { projectId, folderId: data.folderId || null, name: data.name },
  });
  if (existing) throw new AppError('File with this name already exists in this directory', 409);

  return prisma.file.create({
    data: {
      name: data.name,
      content: data.content || '',
      language: data.language || 'plaintext',
      projectId,
      folderId: data.folderId || null,
    },
  });
};

const renameFile = async (userId, projectId, fileId, newName) => {
  await verifyWriteAccess(userId, projectId);

  const file = await prisma.file.findFirst({
    where: { id: fileId, projectId },
  });
  if (!file) throw new AppError('File not found in this project', 404);

  const existing = await prisma.file.findFirst({
    where: { projectId, folderId: file.folderId, name: newName },
  });
  if (existing && existing.id !== fileId) throw new AppError('File with this name already exists', 409);

  return prisma.file.update({ where: { id: fileId }, data: { name: newName } });
};

const updateFileContent = async (userId, projectId, fileId, content) => {
  await verifyWriteAccess(userId, projectId);

  const file = await prisma.file.findFirst({
    where: { id: fileId, projectId },
  });
  if (!file) throw new AppError('File not found in this project', 404);

  // storage.write() returns the Prisma data patch:
  //   LocalProvider → { content }
  //   S3Provider    → { storageKey: 'files/xxx/content', content: '' }
  const dataPatch = await storage.write(fileId, content);

  return prisma.file.update({
    where: { id: fileId },
    data: dataPatch,
  });
};

const deleteFile = async (userId, projectId, fileId) => {
  await verifyWriteAccess(userId, projectId);

  const file = await prisma.file.findFirst({
    where: { id: fileId, projectId },
  });
  if (!file) throw new AppError('File not found in this project', 404);

  await prisma.file.delete({ where: { id: fileId } });
};

// ─── Tree (Recursive CTE) ─────────────────────────────────────────────────────

/**
 * getProjectTree
 *
 * Fetches the full folder tree using a PostgreSQL Recursive CTE.
 * This replaces the old approach of fetching ALL folders flat and
 * building the tree client-side.
 *
 * Why CTE?
 *   - Single round-trip to DB (not N+1 queries for nested folders)
 *   - Results ordered by depth then name = proper tree traversal order
 *   - Handles arbitrary nesting depth
 *   - Server does the heavy lifting, not JS / the frontend
 *
 * CTE SQL:
 *   WITH RECURSIVE folder_tree AS (
 *     -- Base case: root folders (parentId IS NULL)
 *     SELECT id, name, "parentId", "projectId", 0 as depth
 *     FROM folders WHERE "projectId" = $1 AND "parentId" IS NULL
 *     UNION ALL
 *     -- Recursive step: children of already-found folders
 *     SELECT f.id, f.name, f."parentId", f."projectId", ft.depth + 1
 *     FROM folders f JOIN folder_tree ft ON f."parentId" = ft.id
 *   )
 *   SELECT * FROM folder_tree ORDER BY depth, name;
 */
const getProjectTree = async (userId, projectId) => {
  await verifyProjectAccess(userId, projectId);

  // Recursive CTE for ordered folder tree traversal
  const folders = await prisma.$queryRaw`
    WITH RECURSIVE folder_tree AS (
      SELECT
        id,
        name,
        "parentId",
        "projectId",
        "createdAt",
        "updatedAt",
        0 AS depth
      FROM folders
      WHERE "projectId" = ${projectId}::uuid
        AND "parentId" IS NULL

      UNION ALL

      SELECT
        f.id,
        f.name,
        f."parentId",
        f."projectId",
        f."createdAt",
        f."updatedAt",
        ft.depth + 1
      FROM folders f
      INNER JOIN folder_tree ft ON f."parentId" = ft.id
    )
    SELECT id, name, "parentId", "projectId", "createdAt", "updatedAt"
    FROM folder_tree
    ORDER BY depth, name
  `;

  // Files: flat query, NO content column (avoids loading large blobs for tree view)
  const files = await prisma.file.findMany({
    where: { projectId },
    select: {
      id:        true,
      name:      true,
      language:  true,
      folderId:  true,
      updatedAt: true,
    },
  });

  return { folders, files };
};

// ─── Get File Content (with storage abstraction) ─────────────────────────────

const getFileContent = async (userId, projectId, fileId) => {
  await verifyProjectAccess(userId, projectId);

  const file = await prisma.file.findFirst({
    where: { id: fileId, projectId },
  });
  if (!file) throw new AppError('File not found in this project', 404);

  // Use storage provider: reads from DB or S3 depending on USE_S3 env
  const content = await storage.read(file);

  // Return a plain object so the controller can serialize it cleanly
  return { ...file, content };
};

// ─── Chat History (for REST fallback / initial load) ─────────────────────────

const getChatHistory = async (userId, projectId, limit = 200) => {
  await verifyProjectAccess(userId, projectId);

  return prisma.chatMessage.findMany({
    where: { projectId },
    orderBy: { timestamp: 'asc' },
    take: limit,
  });
};

module.exports = {
  createFolder,
  renameFolder,
  deleteFolder,
  createFile,
  renameFile,
  updateFileContent,
  deleteFile,
  getProjectTree,
  getFileContent,
  getChatHistory,
};
