const Bookshelf = require('bookshelf')

const logger = require('../logger')

const hashPassword = require('./hashPassword')

module.exports = function (knexInstance) {
  const bookshelf = Bookshelf(knexInstance)

  const errors = {
    AuthenticationTypeError: class AuthenticationTypeError extends Error {},
    AuthenticationNotImplemented: class AuthenticationNotImplemented extends Error {},
    AuthenticationNotFound: class AuthenticationNotFound extends Error {},
    DuplicateKey: class DuplicateKey extends Error {},
    DuplicateEmail: class DuplicateEmail extends Error {},
    UserNotFound: class UserNotFound extends Error {},
  }

  // Some methods in this file take a second parameter `transaction`.
  // They should definitely be run in a transaction, but we don't really want
  // to construct that if we're calling those methods externally, as that would
  // expose the bookshelf internals.
  // This method wraps the `next` callback in a transaction if it is not passed
  // as an argument.
  const definitelyTransact = transaction => next => {
    if (transaction == null) {
      return bookshelf.transaction(transaction =>
        next(transaction)
          .tap(transaction.commit)
          .catch(transaction.rollback)
      )
    } else {
      return next(transaction)
    }
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
      return definitelyTransact(transaction)(transaction => {
        const authenticationMethods = {
          password: this.createPasswordAuthentication,
          github: this.createTokenAuthentication,
        }

        const {type, token, identifier} = authentication
        if (type == null || token == null || identifier == null) {
          throw new errors.AuthenticationTypeError(`authentication object needs to be of shape {type, token, identifier}`)
        }
        logger.info({userId: this.id, type}, 'will create authentication')

        let createdAuthentication
        switch (type) {
          case 'password':
            createdAuthentication = this.createPasswordAuthentication(authentication, transaction)
            break
          case 'github':
          case 'linkedin':
            createdAuthentication = this.createTokenAuthentication(authentication, transaction)
            break
          default:
            throw new errors.AuthenticationNotImplemented(`authentication type ${type} not implemented`)
        }

        return createdAuthentication
          .then(auth => {
            logger.info({userId: this.id, authenticationId: auth.id}, 'successfully created authentication')
            return auth
          })
      })
    },
    createPasswordAuthentication (authentication, transaction) {
      const {type, identifier, token} = authentication
      return hashPassword(token)
        .then(hash =>
          new Authentication({
            type, identifier, token: hash, userId: this.id,
          }).save(null, {transacting: transaction})
        )
    },
    createTokenAuthentication (authentication, transaction) {
      const {type, identifier, token} = authentication
      return new Authentication({
        type, identifier, token, userId: this.id,
      }).save(null, {transacting: transaction})
        .catch(error => {
          if (error.constraint === 'authentication_type_identifier_unique') {
            throw new errors.DuplicateKey()
          }
          throw error
        })
    },

    updateAuthentication (authentication, transaction) {
      return definitelyTransact(transaction)(transaction => {
        return new Authentication({userId: this.id, type: authentication.type})
          .fetch({transacting: transaction})
          .then(existingAuthentication => {
            if (existingAuthentication) {
              authentication.updatedAt = new Date()
              return existingAuthentication
                .save(authentication, {patch: true, transacting: transaction})
                .catch(error => {
                  if (error.constraint === 'authentication_type_identifier_unique') {
                    throw new errors.DuplicateKey()
                  } else {
                    throw error
                  }
                })
            } else {
              return this.createAuthentication(authentication, transaction)
            }
          }).catch(error => {
            throw error // TODO what errors could happen here?
          })
      })
    },

    updatePassword (password, transaction) {
      const email = this.get('email')
      return definitelyTransact(transaction)(transaction =>
        hashPassword(password)
        .then(hash => {
          const authentication = {
            type: 'password',
            identifier: email,
            token: hash,
          }
          return this.updateAuthentication(authentication, transaction)
        })
      )
    },
  })

  User.createWithAuthentication = function (email, authentication, transaction) {
    return definitelyTransact(transaction)(transaction =>
      new User({email})
        .save(null, {transacting: transaction})
        .catch(error => {
          switch (error.constraint) {
            case 'users_email_unique':
              throw new errors.DuplicateEmail()
            default:
              throw error
          }
        })
        .tap(user => user.createAuthentication(authentication, transaction))
    )
  }

  User.createWithPassword = function (email, password, transaction) {
    const authentication = {
      type: 'password',
      identifier: email,
      token: password,
    }
    return User.createWithAuthentication(email, authentication, transaction)
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
            return User.updateAuthenticationFromEmail(email, authentication)
          case errors.DuplicateKey:
            return User.updateEmailFromAuthentication(email, authentication)
        }
        throw error
      })
  }

  // We can update a user's OAuth key based on their email - this
  // relies on the fact that emails are unique on all supported platforms.
  User.updateAuthenticationFromEmail = function (email, authentication) {
    return new User({email})
      .fetch()
      .tap(user => {
        if (!user) {
          throw new errors.UserNotFound()
        }
        return user.updateAuthentication(authentication)
      })
  }

  // If a user has already registered using OAuth, but their emails have changed
  // since they did so, we can update their email from their id on that platform.
  // This relies on the fact that id's are unique on all supported platforms.
  User.updateEmailFromAuthentication = function (newEmail, authentication) {
    const {type, identifier, token} = authentication
    return bookshelf.transaction(transaction => {
      return new Authentication({type, identifier})
        .fetch({
          withRelated: 'user',
          transacting: transaction,
        })
        .then(authentication => {
          if (!authentication) {
            throw new errors.AuthenticationNotFound('can not update a user if the authentication with which it is supposed to be updated does not exist')
          }
          const user = authentication.related('user')
          if (!user) {
            throw new errors.UserNotFound()
          }
          return user.save({
            updatedAt: new Date(),
            email: newEmail
          }, {
            patch: true,
            transacting: transaction
          })
        })
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
