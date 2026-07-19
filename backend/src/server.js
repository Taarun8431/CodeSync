'use strict';

const app = require('./app');
const prisma = require('./lib/prisma');
const setupSockets = require('./socket');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Verify DB connection
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('✅ Database connected.');

    const server = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 CodeSync API running on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
    });

    // Attach WebSockets for Yjs collaboration
    setupSockets(server);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start server:', err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal) => {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received. Shutting down gracefully...`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
