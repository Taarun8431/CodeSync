'use strict';

const { Router } = require('express');
const executionController = require('../controllers/execution.controller');
const authenticate = require('../../../middlewares/authenticate');
const { executionLimiter } = require('../../../middlewares/rateLimiter');

const router = Router({ mergeParams: true }); // Allows access to /api/projects/:projectId/execute

router.use(authenticate);

// ─── Code Execution ──────────────────────────────────────────────────────────
router.post('/', executionLimiter, executionController.executeCode);

module.exports = router;
