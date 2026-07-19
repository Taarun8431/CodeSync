'use strict';

const { Router } = require('express');
const vfsController = require('../controllers/vfs.controller');
const validate = require('../../../middlewares/validate');
const authenticate = require('../../../middlewares/authenticate');
const {
  createFolderValidator,
  createFileValidator,
  renameValidator,
} = require('../validators/vfs.validator');

const router = Router({ mergeParams: true }); // Allows access to /api/projects/:projectId/vfs/...

router.use(authenticate);

// ─── Project Tree ────────────────────────────────────────────────────────────
router.get('/tree', vfsController.getProjectTree);

// ─── Folders ─────────────────────────────────────────────────────────────────
router.post('/folders', createFolderValidator, validate, vfsController.createFolder);
router.patch('/folders/:folderId/rename', renameValidator, validate, vfsController.renameFolder);
router.delete('/folders/:folderId', vfsController.deleteFolder);

// ─── Files ───────────────────────────────────────────────────────────────────
router.post('/files', createFileValidator, validate, vfsController.createFile);
router.get('/files/:fileId', vfsController.getFileContent);
router.patch('/files/:fileId/rename', renameValidator, validate, vfsController.renameFile);
router.put('/files/:fileId/content', vfsController.updateFileContent);
router.delete('/files/:fileId', vfsController.deleteFile);

module.exports = router;
