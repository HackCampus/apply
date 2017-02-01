const bcrypt = require('bcrypt')
const {promisify} = require('bluebird')

const env = require('../env')

const bcrypt_genSalt = promisify(bcrypt.genSalt)
const bcrypt_hash = promisify(bcrypt.hash)

module.exports = function hashPassword (password) {
  return bcrypt_genSalt(env.saltRounds)
    .then(salt => bcrypt_hash(password, salt))
}
