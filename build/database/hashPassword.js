const bcrypt = require('bcrypt');

const env = require('../env');

module.exports = function hashPassword(password) {
  return bcrypt.hash(password, env.saltRounds);
};