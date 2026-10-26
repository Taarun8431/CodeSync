'use strict';

const app = require('./app');
const prisma = require('./lib/prisma');
const setupSockets = require('./socket');
const { flushAllDocumentsToDb } = require('./socket');

const PORT = process.env.PORT || 5000;
let serverInstance = null;
let isShuttingDown = false;

const start = async () => {
  try {
    // Verify DB connection
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('✅ Database connected.');

    serverInstance = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 CodeSync API running on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
    });

    // Attach WebSockets for Yjs collaboration
    setupSockets(serverInstance);
    return serverInstance;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start server:', err.message);
    await prisma.$disconnect();
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

// Graceful shutdown & crash emergency preservation handler
const shutdown = async (signal, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  // eslint-disable-next-line no-console
  console.log(`\n⚠️  [${signal}] received. Initiating emergency state preservation...`);

  // 1. Stop taking new HTTP and WebSocket connection upgrades
  if (serverInstance) {
    serverInstance.close();
  }

  try {
    // 2. Flush all active in-memory Yjs documents directly to PostgreSQL
    await flushAllDocumentsToDb(5000);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Error during document emergency flush:', err.message);
  } finally {
    // 3. Disconnect database client cleanly
    try {
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect errors during process shutdown
    }

    // eslint-disable-next-line no-console
    console.log(`🛑 Server shutdown complete. Exiting with code ${exitCode}.`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(exitCode);
    }
  }
};

// OS termination signals (Docker stop, PM2 reload, systemd, Ctrl+C)
process.on('SIGTERM', () => shutdown('SIGTERM', 0));
process.on('SIGINT', () => shutdown('SIGINT', 0));

// Process crash listeners (Unhandled runtime exceptions & promise rejections)
process.on('uncaughtException', async (err) => {
  // eslint-disable-next-line no-console
  console.error('💥 UNCAUGHT EXCEPTION:', err);
  await shutdown('uncaughtException', 1);
});

process.on('unhandledRejection', async (reason) => {
  // eslint-disable-next-line no-console
  console.error('💥 UNHANDLED PROMISE REJECTION:', reason);
  await shutdown('unhandledRejection', 1);
});

if (require.main === module) {
  start();
}

module.exports = { start, shutdown };
