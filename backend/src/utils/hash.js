'use strict';

const bcrypt = require('bcryptjs');
const config = require('../config/env');

const hashPassword = async (plain) => {
  return bcrypt.hash(plain, config.bcrypt.saltRounds);
};

const comparePassword = async (plain, hashed) => {
  return bcrypt.compare(plain, hashed);
};

module.exports = { hashPassword, comparePassword };
