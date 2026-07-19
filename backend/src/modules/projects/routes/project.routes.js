'use strict';

const { Router } = require('express');
const projectController = require('../controllers/project.controller');
const validate = require('../../../middlewares/validate');
const authenticate = require('../../../middlewares/authenticate');
const {
  createProjectValidator,
  updateProjectValidator,
  memberValidator,
} = require('../validators/project.validator');

const router = Router();

router.use(authenticate);

// ─── Workspace Independent ──────────────────────────────────────────────────
router.post('/join', projectController.joinByCode);

// ─── Projects ────────────────────────────────────────────────────────────────
router.post('/', createProjectValidator, validate, projectController.createProject);
router.get('/', projectController.getProjectsByWorkspace); // expects ?workspaceId=...
router.get('/:id', projectController.getProjectById);
router.patch('/:id', updateProjectValidator, validate, projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// ─── Members ────────────────────────────────────────────────────────────────
router.post('/:id/members', memberValidator, validate, projectController.addMember);
router.delete('/:id/members/:userId', projectController.removeMember);

// ─── Share ──────────────────────────────────────────────────────────────────
router.post('/:projectId/share', projectController.generateShareLink);

module.exports = router;
