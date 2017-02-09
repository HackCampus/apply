const constants = require('../../constants')

const errors = require('../errors')

module.exports = bsModels => {

  const BsModel = bsModels.Application

  return class Application {
    constructor (bs) {
      this.bs = bs == null ? new BsModel() : bs
    }

    toJSON () {
      return this.bs.toJSON({
        shallow: true, // do not include relations - explicitly fetch them instead.
      })
    }

    //
    // GETTERS
    //

    get id () {
      return this.bs.id
    }

    //
    // BS INTERFACE VIOLATIONS
    //

    static where () {
      console.trace('using bs method! where')
      return bsModels.Application.where(...arguments)
    }

    get () {
      console.trace('using bs method! get')
      return this.bs.get(...arguments)
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
      const bs = await BsModel.where(...query).fetchAll()
      const bsArray = bs.toArray()
      const applications = bsArray.map(bs => new this(bs))
      return applications
    }

    static async fetchAllCurrent () {
      return Application.fetchAll({programmeYear: constants.programmeYear})
    }

    static async fetchAllUnfinished () {
      return Application.fetchAll({programmeYear: constants.programmeYear, finishedAt: null})
    }

    //
    // RELATIONS
    //

    async fetchTechPreferences () {
      const bs = await this.bs.load('techPreferences')
      const bsJson = bs.toJSON()
      const results = bsJson['techPreferences']
      if (results == null) {
        throw errors.NotFound()
      }
      const techPreferences = {}
      results.forEach(({technology, preference}) => {
        techPreferences[technology] = preference
      })
      return techPreferences
    }

    //
    // CREATE
    //

    static async create (fields, transaction) {
      const required = {programmeYear: constants.programmeYear}
      const actualFields = Object.assign({}, required, fields)
      const bs = await new BsModel(actualFields).save(null, {
        method: 'insert',
        transacting: transaction,
      })
      await bs.fetch()
      return new this(bs)
    }
  }
}
