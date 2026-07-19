'use strict';

const prisma = require('../../../lib/prisma');
const nodemailer = require('nodemailer');
const config = require('../../../config/env');

const checkDatabase = async () => {
  try {
    // Simple fast query to check DB connection
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'up' };
  } catch (error) {
    return { status: 'down', error: error.message };
  }
};

const checkSMTP = async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
    
    await transporter.verify();
    return { status: 'up' };
  } catch (error) {
    return { status: 'down', error: error.message };
  }
};

const liveness = (req, res) => {
  res.status(200).json({ success: true, message: 'Server is alive' });
};

const readiness = async (req, res) => {
  const [dbHealth, smtpHealth] = await Promise.all([
    checkDatabase(),
    checkSMTP()
  ]);

  const isReady = dbHealth.status === 'up' && smtpHealth.status === 'up';
  
  const response = {
    success: isReady,
    dependencies: {
      database: dbHealth,
      smtp: smtpHealth
    },
    timestamp: new Date().toISOString()
  };

  res.status(isReady ? 200 : 503).json(response);
};

module.exports = {
  liveness,
  readiness,
};
