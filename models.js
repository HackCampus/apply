const bcrypt = require('bcrypt')
const {promisify} = require('bluebird')
const Bookshelf = require('bookshelf')
const Knex = require('knex')

const config = require('../config')
const knexConfig = require('./knexfile')

const knex = Knex(knexConfig)
const bookshelf = Bookshelf(knex)
const genSalt = promisify(bcrypt.genSalt)
const hash = promisify(bcrypt.hash)

const User = bookshelf.Model.extend({
  tableName: 'users',
  hasTimeStamps: ['createdAt', 'updatedAt'],
  authentication: function () {
    return this.hasMany(Authentication, 'userId')
  },
  createAuthentication: function (authentication, transaction) {
    const {type} = authentication
    switch (type) {
      case 'password': return this.createPasswordAuthentication(authentication, transaction)
      case 'github': return this.createTokenAuthentication(authentication, transaction)
      default: throw new Error(`authentication type ${type} not implemented`)
    }
  },
  createPasswordAuthentication: function (authentication, transaction) {
    const {type, identifier, token} = authentication
    return genSalt(config.saltRounds)
      .then(salt => hash(token, salt))
      .then(hash =>
        new Authentication({
          type,
          identifier,
          token: hash,
          userId: this.id,
        }).save(null, {transacting: transaction})
      )
  },
  createTokenAuthentication: function (authentication, transaction) {
    const {type, identifier, token} = authentication
    return new Authentication({
      type,
      identifier,
      token,
      userId: this.id,
    }).save(null, {transacting: transaction})
  },
})

const Authentication = bookshelf.Model.extend({
  tableName: 'authentication',
  hasTimeStamps: ['createdAt', 'updatedAt'],
  user: function () {
    return this.belongsTo(User, 'userId')
  }
})

User.createWithAuthentication = function (email, authentication) {
  return bookshelf.transaction(transaction =>
    new User({email})
      .save(null, {transacting: transaction})
      .tap(user => user.createAuthentication(authentication, transaction))
      .then(transaction.commit)
      .catch(transaction.rollback)
  )
}

User.updateAuthentication = function (email, authentication) {
  return bookshelf.transaction(transaction =>
    User.where('email', email).fetch({
      withRelated: ['authentication'],
      transacting: transaction,
    }).then(user => {
      const auth = user.related('authentication')
      const existingAuthentication = auth.findWhere({type: authentication.type})
      if (existingAuthentication) {
        return existingAuthentication.save(authentication, {patch: true, transacting: transaction})
      } else {
        return user.createAuthentication(authentication)
      }
    })
  )
}

User.createWithPassword = function (email, password) {
  const authentication = {
    type: 'password',
    identifier: email,
    token: password,
  }
  return User.createWithAuthentication(email, authentication)
}

User.createWithGithub = function (email, accessToken) {
  const authentication = {
    type: 'github',
    identifier: email,
    token: accessToken,
  }
  return User.createWithAuthentication(email, authentication)
    .catch(error => {
      if (error.constraint === 'users_email_unique') {
        return User.updateAuthentication(email, authentication)
      }
      return error
    })
}

module.exports = {
  Authentication,
  Database: bookshelf,
  User,
}
