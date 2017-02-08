const constants = require('../../constants')

const errors = require('../errors')

module.exports = bsModels => {

  const BsModel = bsModels.ApplicationEvent

  return class Application {
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
    // BS INTERFACE VIOLATIONS
    //

    //
    // FETCH
    //

    static async fetchById (id) {
      const bs = await BsModel.where('id', '=', id).fetch({withRelated: 'actor'})
      return new this(bs)
    }

    static async fetchAll (where) {
      const filters = Object.assign({}, where)
      const bs = await BsModel
        .where(filters)
        .orderBy('ts', 'ASC')
        .fetchAll({withRelated: 'actor'})
      const bsArray = bs.toArray()
      const applications = bsArray.map(bs => new this(bs))
      return applications
    }

    static async fetchByApplicationId (applicationId) {
      return this.fetchAll({applicationId})
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
      return new this(bs)
    }
  }
}
