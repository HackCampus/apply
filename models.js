const bcrypt = require('bcrypt')
const Bookshelf = require('bookshelf')
const Knex = require('knex')

const config = require('../config')
const knexConfig = require('./knexfile')

const knex = Knex(knexConfig)
const bookshelf = Bookshelf(knex)

const User = bookshelf.Model.extend({
  tableName: 'users',
  hasTimeStamps: ['createdAt', 'updatedAt'],
  authentication: function () {
    return this.hasMany(Authentication, 'userId')
  }
})

const Authentication = bookshelf.Model.extend({
  tableName: 'authentication',
  hasTimeStamps: ['createdAt', 'updatedAt'],
  user: function () {
    return this.belongsTo(User, 'userId')
  }
})

Authentication.createForUser = (user, authentication, transaction) => new Promise((resolve, reject) => {
  const {type, identifier, token} = authentication
  if (type === 'password') {
    bcrypt.genSalt(config.saltRounds, (err, salt) => {
      if (err) return reject(err)
      bcrypt.hash(token, salt, (err, hash) => {
        if (err) return reject(err)
        new Authentication({type, token: hash, userId: user.id})
        .save(null, {transacting: transaction})
        .then(auth => resolve(auth))
        .catch(err => reject(err))
      })
    })
  }
})

module.exports = {
  Authentication,
  Database: bookshelf,
  User,
}
