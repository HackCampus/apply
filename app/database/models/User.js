const logger = require('../../logger') // TODO remove

const errors = require('../errors')
const hashPassword = require('../hashPassword')

module.exports = bsModels => {
  // Some model methods take a parameter `transaction`.
  // They should definitely be run in a transaction, but we don't really want
  // to construct that if we're calling those methods externally, as that would
  // expose the bookshelf internals.
  // This method wraps the `next` callback in a transaction if it is not passed
  // as an argument.
  const definitelyTransact = transaction => next => {
    if (transaction == null) {
      return bsModels.bookshelf.transaction(transaction =>
        next(transaction)
          .tap(transaction.commit)
          .catch(transaction.rollback)
      )
    } else {
      return next(transaction)
    }
  }

  return class User {
    constructor (bs) {
      this.bs = bs == null ? new bsModels.User() : bs
    }

    toJSON () {
      return this.bs.toJSON()
    }

    get id () {
      return this.bs.id
    }

    // interface violations

    static where () {
      console.warn('using bs method! where')
      return bsModels.User.where(...arguments)
    }

    get () {
      console.warn('using bs method! get')
      return this.bs.get(...arguments)
    }

    tap () {
      console.warn('using bs method! tap')
      return this.bs.tap(...arguments)
    }

    // end interface violations

    static create (fields, transaction) {
      const bs = new bsModels.User(fields)
        .save(null, {transacting: transaction})
        .catch(error => {
          switch (error.constraint) {
            case 'users_email_unique':
              throw new errors.DuplicateEmail()
            default:
              throw error
          }
        })
      return new User(bs)
    }

    static createWithAuthentication (email, authentication, transaction) {
      return definitelyTransact(transaction)(transaction => {
        const bs = new bsModels.User({email})
          .save(null, {transacting: transaction})
          .catch(error => {
            switch (error.constraint) {
              case 'users_email_unique':
                throw new errors.DuplicateEmail()
              default:
                throw error
            }
          })
          .tap(bs => new User(bs).createAuthentication(authentication, transaction))
        return new User(bs)
      })
    }

    static createWithPassword (email, password, transaction) {
      const authentication = {
        type: 'password',
        identifier: email,
        token: password,
      }
      return User.createWithAuthentication(email, authentication, transaction)
    }

    static createWithToken (provider, email, providerId, accessToken) {
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
    static updateAuthenticationFromEmail (email, authentication) {
      const bs = new bsModels.User({email})
        .fetch()
        .tap(bs => {
          if (!bs) {
            throw new errors.UserNotFound()
          }
          return new User(bs).updateAuthentication(authentication)
        })
      return new User(bs)
    }

    // If a user has already registered using OAuth, but their emails have changed
    // since they did so, we can update their email from their id on that platform.
    // This relies on the fact that id's are unique on all supported platforms.
    static updateEmailFromAuthentication (newEmail, authentication) {
      const {type, identifier, token} = authentication
      return bsModels.bookshelf.transaction(transaction => {
        return new bsModels.Authentication({type, identifier})
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
    }
    createPasswordAuthentication (authentication, transaction) {
      const {type, identifier, token} = authentication
      return hashPassword(token)
        .then(hash =>
          new bsModels.Authentication({
            type, identifier, token: hash, userId: this.id,
          }).save(null, {transacting: transaction})
        )
    }
    createTokenAuthentication (authentication, transaction) {
      const {type, identifier, token} = authentication
      return new bsModels.Authentication({
        type, identifier, token, userId: this.id,
      }).save(null, {transacting: transaction})
        .catch(error => {
          if (error.constraint === 'authentication_type_identifier_unique') {
            throw new errors.DuplicateKey()
          }
          throw error
        })
    }

    updateAuthentication (authentication, transaction) {
      return definitelyTransact(transaction)(transaction => {
        return new bsModels.Authentication({userId: this.id, type: authentication.type})
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
    }

    updatePassword (password, transaction) {
      const email = this.bs.get('email')
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
    }
  }
}
