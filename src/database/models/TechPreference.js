import type {Model} from './Model'

const errors = require('../errors')

module.exports = bsModels => {
  const BsModel = bsModels.TechPreference

  return class TechPreference implements Model {
    constructor (bs) {
      this.bs = bs == null ? new BsModel() : bs
    }

    //
    // GET
    //

    get id () {
      return this.bs.id
    }

    get technology () {
      return this.bs.get('technology')
    }

    get preference () {
      return this.bs.get('preference')
    }

    //
    // FETCH
    //

    static async fetchById (id) {
      const bs = await BsModel.where('id', '=', id).fetch()
      return new this(bs)
    }

    static async fetchSingle (...query) {
      const bs = await BsModel.where(...query).fetchAll()
      if (bs.length === 0) {
        throw new errors.NotFound()
      } else if (bs.length > 1) {
        console.trace(`ambiguous query in fetchSingle, returned ${bs.length} objects, not 1:`, ...query)
      }
      const b = bs.at(0)
      return new this(b)
    }

    static async fetchAll (...query) {
      const bsModel = query.length > 0
        ? BsModel.where(...query)
        : BsModel
      const bs = await bsModel.fetchAll()
      const bsArray = bs.toArray()
      const models = bsArray.map(bs => new this(bs))
      return models
    }

    static async fetchAllByApplication (applicationId) {
      const preferences = await TechPreference.fetchAll('applicationId', '=', applicationId)
      const preferencesByName = {}
      preferences.forEach(({technology, preference}) => {
        preferencesByName[technology] = preference
      })
      return preferencesByName
    }

    //
    // CREATE
    //

    static async create (applicationId, fields, transaction) {
      const required = {applicationId}
      const actualFields = Object.assign({}, required, fields)
      try {
        const existing = await TechPreference.fetchSingle({applicationId, technology: fields.technology})
        await existing.update(fields, transaction)
        return existing
      } catch (e) {
        if (e instanceof errors.NotFound) {
          const bs = await new BsModel(actualFields).save(null, {
            method: 'insert',
            transacting: transaction,
          })
          return new this(bs)
        }
      }
    }

    //
    // UPDATE
    //

    async update (fields, transaction) {
      if (fields == null || Object.keys(fields).length == 0) {
        return this
      }
      const bs = await new BsModel({id: this.id}).save(fields, {
        method: 'update',
        transacting: transaction,
        patch: true,
      })
      await bs.fetch()
      this.bs = bs
      return this
    }

    //
    // MATERIALIZE
    //

    // toJSON does not include relations - you have to explicitly fetch them instead.
    toJSON () {
      return this.bs.toJSON({
        shallow: true,
      })
    }

    // Returns a JSON object of the full model, ready to be sent over the wire.
    async materialize () {
      let application = this.toJSON()
      application.status = await this.fetchStatus()
      application.techPreferences = await this.fetchTechPreferences()
      return application
    }
  }
}
