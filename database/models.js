const bcrypt = require('bcrypt')
const {promisify} = require('bluebird')
const Bookshelf = require('bookshelf')

const env = require('../env')

module.exports = function (knexInstance) {
  const bookshelf = Bookshelf(knexInstance)

  const genSalt = promisify(bcrypt.genSalt)
  const hash = promisify(bcrypt.hash)

  const errors = {
    AuthenticationTypeError: class AuthenticationTypeError extends Error {},
    AuthenticationNotImplemented: class AuthenticationNotImplemented extends Error {},
    DuplicateKey: class DuplicateKey extends Error {},
    DuplicateEmail: class DuplicateEmail extends Error {},
  }

  const User = bookshelf.Model.extend({
    tableName: 'users',
    hasTimeStamps: ['createdAt', 'updatedAt'],

    // relations
    authentication () {
      return this.hasMany(Authentication, 'userId')
    },
    application () {
      return this.hasMany(Application, 'userId')
    },

    // convenience methods
    createAuthentication (authentication, transaction) {
      const {type, token, identifier} = authentication
      if (type == null || token == null || identifier == null) {
        throw new errors.AuthenticationTypeError(`authentication object needs to be of shape {type, token, identifier}`)
      }
      switch (type) {
        case 'password': return this.createPasswordAuthentication(authentication, transaction)
        case 'github': return this.createTokenAuthentication(authentication, transaction)
        default: throw new errors.AuthenticationNotImplemented(`authentication type ${type} not implemented`)
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

    updateAuthentication (authentication, transaction) {
      const auth = this.related('authentication')
      const existingAuthentication = auth.findWhere({userId: this.id, type: authentication.type})
      if (existingAuthentication) {
        return existingAuthentication
          .save(authentication, {patch: true, transacting: transaction})
      } else {
        return this.createAuthentication(authentication, transaction)
      }
    }
  })

  User.createWithAuthentication = function (email, authentication) {
    return bookshelf.transaction(transaction =>
      new User({email})
        .save(null, {transacting: transaction})
        .tap(user => user.createAuthentication(authentication, transaction))
        .catch(error => {
          switch (error.constraint) {
            case 'users_email_unique':
              throw new errors.DuplicateEmail()
            case 'authentication_type_identifier_unique':
              throw new errors.DuplicateKey()
            default:
              throw error
          }
        })
        .then(transaction.commit)
        .catch(transaction.rollback)
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

  // throws errors.DuplicateKey
  User.createWithToken = function (provider, email, providerId, accessToken) {
    const authentication = {
      type: provider,
      identifier: providerId,
      token: accessToken,
    }
    return User.createWithAuthentication(email, authentication)
      .catch(error => {
        switch (error.constructor) {
          case errors.DuplicateEmail:
            return User.where('email', email).fetch(user => {
              return user.updateAuthentication(authentication)
                .then(_ => user)
            })
          case errors.DuplicateKey:
            throw new errors.DuplicateKey(`authentication key ${JSON.stringify(authentication)} for user ${email} already exists for another user`)
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
