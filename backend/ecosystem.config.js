'use strict';

module.exports = {
  apps: [
    {
      name: 'codesync-backend',
      script: './src/server.js',
      instances: 1,
      autorestart: true,
      max_restarts: 50,
      restart_delay: 500,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
