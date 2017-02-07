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
  async function definitelyTransact (transaction, next) {
    if (transaction == null) {
      return bsModels.bookshelf.transaction(async transaction => next(transaction))
    } else {
      return next(transaction)
    }
  }

  return class User {
    constructor (bs) {
      this.bs = bs == null ? new bsModels.User() : bs
    }

    toJSON () {
      return this.bs.toJSON({
        shallow: true, // do not include relations - explicitly fetch them instead.
      })
    }

    //
    // BASIC FIELD GETTERS
    //

    get id () {
      return this.bs.id
    }

    get email () {
      return this.bs.get('email')
    }

    get role () {
      return this.bs.get('role')
    }

    //
    // BS INTERFACE VIOLATIONS
    //

    static where () {
      console.trace('using bs method! where')
      return bsModels.User.where(...arguments)
    }

    get () {
      console.trace('using bs method! get')
      return this.bs.get(...arguments)
    }

    //
    // FETCH
    //

    static async fetchById (id) {
      const bs = await bsModels.User.where('id', '=', id).fetch()
      return new User(bs)
    }

    static async fetchSingle (...query) {
      const bs = await bsModels.User.where(...query).fetchAll()
      if (bs.length === 0) {
        throw new errors.UserNotFound()
      } else if (bs.length > 1) {
        console.trace(`ambiguous query in User.fetchSingle, returned ${bs.length} objects, not 1:`, ...query)
      }
      const b = bs.at(0)
      return new User(b)
    }

    //
    // RELATIONS
    //

    // Returns JSON representation
    async fetchAuthentications () {
      const bs = await this.bs.load('authentication')
      const bsJson = bs.toJSON()
      return bsJson['authentication']
    }

    //
    // CREATE
    //

    static async create (fields, transaction) {
      try {
        const bs = await new bsModels.User(fields).save(null, {
          method: 'insert',
          transacting: transaction,
        })
        await bs.fetch() // this is so stupid. need to do this, otherwise "toJSON" calls won't have all fields set.
        return new User(bs)
      } catch (error) {
        switch (error.constraint) {
          case 'users_email_unique':
            throw new errors.DuplicateEmail()
          default:
            throw error
        }
      }
    }

    static async createWithAuthentication (email, authentication, transaction) {
      return definitelyTransact(transaction, async transaction => {
        const user = await User.create({email}, transaction)
        await user.createAuthentication(authentication, transaction)
        return user
      })
    }

    static async createWithPassword (email, password, transaction) {
      const authentication = {
        type: 'password',
        identifier: email,
        token: password,
      }
      return await User.createWithAuthentication(email, authentication, transaction)
    }

    static async createWithToken (provider, email, providerId, accessToken) {
      const authentication = {
        type: provider,
        identifier: providerId,
        token: accessToken,
      }
      try {
        return await User.createWithAuthentication(email, authentication)
      } catch (error) {
        switch (error.constructor) {
          case errors.DuplicateEmail:
            return await User._updateAuthenticationFromEmail(email, authentication)
        }
        throw error
      }
    }

    // We can update a user's OAuth key based on their email - this
    // relies on the fact that emails are unique on all supported platforms.
    static async _updateAuthenticationFromEmail (email, authentication) {
      const user = await User.fetchSingle({email})
      await user.updateAuthentication(authentication)
      return user
    }

    // Returns JSON representation of new authentication object
    async createAuthentication (authentication, transaction) {
      return definitelyTransact(transaction, async transaction => {
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

        const auth = await createdAuthentication
        logger.info({userId: this.id, authenticationId: auth.id}, 'successfully created authentication')
        return auth.toJSON()
      })
    }
    async createPasswordAuthentication (authentication, transaction) {
      const {type, identifier, token} = authentication
      const hash = await hashPassword(token)
      const authenticationBs = await new bsModels.Authentication({
        type, identifier, token: hash, userId: this.id,
      }).save(null, {transacting: transaction})
      return authenticationBs // TODO return proper authentication object
    }
    async createTokenAuthentication (authentication, transaction) {
      const {type, identifier, token} = authentication
      try {
        return await new bsModels.Authentication({
          type, identifier, token, userId: this.id,
        }).save(null, {transacting: transaction})
      } catch (error) {
        if (error.constraint === 'authentication_type_identifier_unique') {
          throw new errors.DuplicateKey()
        }
        throw error
      }
    }

    //
    // UPDATE
    //

    async update (fields, transaction) {
      const updatedFields = Object.assign({}, fields, {updatedAt: new Date()})
      try {
        await this.bs.save(updatedFields, {patch: true, transacting: transaction})
        return this
      } catch (error) {
        switch (error.constraint) {
          case 'users_email_unique':
            throw new errors.DuplicateEmail()
          default:
            throw error
        }
      }
    }

    // Returns JSON representation of authentication model.
    async updateAuthentication (authentication, transaction) {
      return definitelyTransact(transaction, async transaction => {
        const existingAuthentication = await new bsModels.Authentication({userId: this.id, type: authentication.type})
          .fetch({transacting: transaction})
        if (existingAuthentication) {
          authentication.updatedAt = new Date()
          try {
            const authenticationModel = await existingAuthentication
              .save(authentication, {patch: true, transacting: transaction})
            return authenticationModel.toJSON()
          } catch (error) {
            if (error.constraint === 'authentication_type_identifier_unique') {
              throw new errors.DuplicateKey()
            } else {
              throw error
            }
          }
        } else {
          return await this.createAuthentication(authentication, transaction)
        }
      })
    }

    async updatePassword (password, transaction) {
      const email = this.bs.get('email')
      return definitelyTransact(transaction, async transaction => {
        const hash = await hashPassword(password)
        const authentication = {
          type: 'password',
          identifier: email,
          token: hash,
        }
        return await this.updateAuthentication(authentication, transaction)
      })
    }
  }
}
