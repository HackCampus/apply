const values = require('object.values')

const constants = require('../../constants')
const logger = require('../../logger')

const errors = require('../errors')

const applicationEvents = require('./applicationEvents')
const UserModel = require('./User')

// eg. comments do not affect the status.
const nonStatusEventTypes = values(applicationEvents)
  .filter(({affectsStatus}) => !affectsStatus)
  .map(({type}) => type)

module.exports = bsModels => {

  const BsModel = bsModels.ApplicationEvent
  const User = UserModel(bsModels)

  return class ApplicationEvent {
    constructor (bs) {
      this.bs = bs == null ? new BsModel() : bs
    }

    toJSON () {
      return this.bs.toJSON()
    }

    //
    // GETTERS
    //

    get id () {
      return this.bs.id
    }

    get timestamp () {
      return this.bs.get('ts')
    }

    get type () {
      return this.bs.get('type')
    }

    get payload () {
      return this.bs.get('payload')
    }

    get actorId () {
      return this.bs.get('actorId')
    }

    get applicationId () {
      return this.bs.get('applicationId')
    }

    //
    // RELATIONS
    //

    async fetchActor () {
      return User.fetchById(this.actorId)
    }

    //
    // FETCH
    //

    static async fetchById (id) {
      try {
        const bs = await BsModel.where('id', '=', id).fetch({withRelated: 'actor'})
        return new this(bs)
      } catch (error) {
        throw new errors.NotFound()
      }
    }

    static async fetchAll (where) {
      where = Object.assign({}, where)
      const bs = await BsModel
        .where(where)
        .orderBy('ts', 'DESC')
        .fetchAll({withRelated: 'actor'})
      const bsArray = bs.toArray()
      const applications = bsArray.map(bs => new this(bs))
      return applications
    }

    static async fetchAllByApplicationId (applicationId) {
      return this.fetchAll({applicationId})
    }

    static async fetchStatusByApplicationId (applicationId) {
      const bs = await BsModel
        .query(qb => {
          qb.where('applicationId', '=', applicationId)
          nonStatusEventTypes.forEach(type => {
            qb.where('type', '<>', type)
          })
          qb.orderBy('ts', 'DESC')
          qb.limit(1)
        })
        .fetchAll({withRelated: 'actor'})
      const bsArray = bs.toArray()
      if (bsArray.length === 0) {
        return null
      } else if (bsArray.length > 1) {
        console.trace('something is messed up with the query...')
      }
      const application = new this(bsArray[0])
      return application
    }

    //
    // CREATE
    //

    static async create (fields, transaction) {
      const bs = await new BsModel(fields).save(null, {
        method: 'insert',
        transacting: transaction,
      })
      await bs.refresh({withRelated: 'actor'})
      logger.info(fields, 'application event')
      return new this(bs)
    }

    //
    // DELETE
    //

    async delete (transaction) {
      await this.bs.destroy({
        transacting: transaction,
      })
      return null
    }
  }
}
