'use strict';

const { Router } = require('express');
const workspaceController = require('../controllers/workspace.controller');
const validate = require('../../../middlewares/validate');
const authenticate = require('../../../middlewares/authenticate');
const {
  createWorkspaceValidator,
  updateWorkspaceValidator,
} = require('../validators/workspace.validator');

const router = Router();

router.use(authenticate);

router.post('/', createWorkspaceValidator, validate, workspaceController.createWorkspace);
router.get('/', workspaceController.getWorkspaces);
router.get('/:id', workspaceController.getWorkspaceById);
router.patch('/:id', updateWorkspaceValidator, validate, workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);

module.exports = router;
