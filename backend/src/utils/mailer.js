'use strict';

const nodemailer = require('nodemailer');
const config = require('../config/env');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

/**
 * Send an email
 * @param {object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
  });
};

/**
 * Email templates
 */
const emailTemplates = {
  emailVerification: (username, verifyUrl) => ({
    subject: 'Verify your CodeSync email',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to CodeSync, ${username}!</h2>
        <p>Please verify your email address by clicking the button below.</p>
        <p>This link expires in <strong>24 hours</strong>.</p>
        <a href="${verifyUrl}" 
           style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;border-radius:6px;text-decoration:none;">
          Verify Email
        </a>
        <p style="margin-top:16px;color:#6b7280;font-size:14px;">
          If you didn't create an account, you can ignore this email.
        </p>
      </div>
    `,
  }),

  passwordReset: (username, resetUrl) => ({
    subject: 'Reset your CodeSync password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${username}, we received a request to reset your password.</p>
        <p>This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" 
           style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
        <p style="margin-top:16px;color:#6b7280;font-size:14px;">
          If you didn't request this, please ignore this email — your password won't change.
        </p>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
