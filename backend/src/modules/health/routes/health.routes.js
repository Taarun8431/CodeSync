'use strict';

const { Router } = require('express');
const healthController = require('../controllers/health.controller');

const router = Router();

// GET /api/health/liveness
router.get('/liveness', healthController.liveness);

// GET /api/health/readiness
router.get('/readiness', healthController.readiness);

module.exports = router;
