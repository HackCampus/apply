const bcrypt = require('bcrypt')
const {promisify} = require('bluebird')
const Bookshelf = require('bookshelf')

const env = require('../env')

module.exports = function (knexInstance) {
  const bookshelf = Bookshelf(knexInstance)

  const genSalt = promisify(bcrypt.genSalt)
  const hash = promisify(bcrypt.hash)

  const errors = {
    authenticationTypeError: () => new Error(`authentication object needs to be of shape {type, token, identifier}`),
    authenticationNotImplemented: type => new Error(`authentication type ${type} not implemented`),
    duplicateKey: (authentication, email) => new Error(`authentication key ${JSON.stringify(authentication)} for user ${email} already exists for another user`),
  }

  const User = bookshelf.Model.extend({
    tableName: 'users',
    hasTimeStamps: ['createdAt', 'updatedAt'],

    // relations
    authentication: function () {
      return this.hasMany(Authentication, 'userId')
    },
    application: function () {
      return this.hasMany(Application, 'userId')
    },

    // convenience methods
    createAuthentication: function (authentication, transaction) {
      const {type, token, identifier} = authentication
      if (type == null || token == null || identifier == null) {
        throw errors.authenticationTypeError()
      }
      switch (type) {
        case 'password': return this.createPasswordAuthentication(authentication, transaction)
        case 'github': return this.createTokenAuthentication(authentication, transaction)
        default: throw errors.authenticationNotImplemented(type)
      }
    },
    createPasswordAuthentication: function (authentication, transaction) {
      const {type, identifier, token} = authentication
      return genSalt(env.saltRounds)
        .then(salt => hash(token, salt))
        .then(hash =>
          new Authentication({
            type, identifier, token: hash, userId: this.id,
          }).save(null, {transacting: transaction})
        )
    },
    createTokenAuthentication: function (authentication, transaction) {
      const {type, identifier, token} = authentication
      return new Authentication({
        type, identifier, token, userId: this.id,
      }).save(null, {transacting: transaction})
    },
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
        const existingAuthentication = auth.findWhere({userId: user.id, type: authentication.type})
        if (existingAuthentication) {
          return existingAuthentication
            .save(authentication, {patch: true, transacting: transaction})
            .catch(error => {
              if (error.constraint === 'authentication_type_identifier_unique') {
                throw errors.duplicateKey(authentication, email)
              }
              throw error
            }).then(_ => user)
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

  // throws errors.duplicateKey
  User.createWithToken = function (provider, email, providerId, accessToken) {
    const authentication = {
      type: provider,
      identifier: providerId,
      token: accessToken,
    }
    return User.createWithAuthentication(email, authentication)
      .catch(error => {
        switch (error.constraint) {
          case 'users_email_unique':
            return User.updateAuthentication(email, authentication)
          case 'authentication_type_identifier_unique':
            throw errors.duplicateKey(authentication, email)
        }
        throw error
      })
  }

  const Authentication = bookshelf.Model.extend({
    tableName: 'authentication',
    hasTimeStamps: ['createdAt', 'updatedAt'],

    user: function () {
      return this.belongsTo(User, 'userId')
    },
  })

  const Application = bookshelf.Model.extend({
    tableName: 'applications',
    hasTimeStamps: ['createdAt', 'updatedAt'],

    user: function () {
      return this.belongsTo(User, 'userId')
    },
    techPreferences: function () {
      return this.hasMany(TechPreference, 'applicationId')
    },
  })

  const TechPreference = bookshelf.Model.extend({
    tableName: 'techpreferences',
    hasTimeStamps: ['createdAt'],

    application: function () {
      return this.belongsTo(Application, 'applicationId')
    },
  })

  return {
    errors,
    Authentication,
    Database: bookshelf,
    User,
    TechPreference,
    Application,
  }
}
