'use strict';
// Nodemon restart trigger

require('./config/env'); // validates env vars at startup

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const authRoutes = require('./modules/auth/routes/auth.routes');
const userRoutes = require('./modules/users/routes/user.routes');
const workspaceRoutes = require('./modules/workspaces/routes/workspace.routes');
const projectRoutes = require('./modules/projects/routes/project.routes');
const vfsRoutes = require('./modules/vfs/routes/vfs.routes');
const executionRoutes = require('./modules/execution/routes/execution.routes');
const healthRoutes = require('./modules/health/routes/health.routes');
const errorHandler = require('./middlewares/errorHandler');
const { sendError } = require('./utils/apiResponse');

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Required for sending HTTP-only cookies
  optionsSuccessStatus: 200
}));

// ─── Global rate limit ────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ─── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Swagger Documentation ───────────────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'CodeSync API', version: '1.0.0', description: 'API for CodeSync Collaborative IDE' },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/modules/**/*.routes.js'] // Path to route files for JSDoc annotations
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'CodeSync API Docs' }));

// ─── API Routes ───────────────────────────────────────────────────────────────
const apiRouter = express.Router();
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/workspaces', workspaceRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/projects/:projectId/vfs', vfsRoutes);
apiRouter.use('/projects/:projectId/execute', executionRoutes);

app.use('/api/v1', apiRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  sendError(res, { statusCode: 404, message: 'Route not found.' });
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
