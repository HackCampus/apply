module.exports = bsModels => {

  const BsModel = bsModels.Company

  return class Company {
    constructor (bs) {
      this.bs = bs == null ? new BsModel() : bs
    }

    toJSON () {
      const bsJson = this.bs.toJSON({
        shallow: true, // do not include relations - explicitly fetch them instead.
      })
      bsJson.stack = JSON.parse(bsJson.stack)
      return bsJson
    }

    //
    // GETTERS
    //

    get id () {
      return this.bs.id
    }

    get name () {
      return this.bs.get('name')
    }

    get website () {
      return this.bs.get('website')
    }

    get description () {
      return this.bs.get('description')
    }

    get stack () {
      return JSON.parse(this.bs.get('stack'))
    }

    //
    // FETCH
    //

    static async fetchByName (name) {
      const bs = await BsModel.where('name', '=', name).fetch()
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
      const applications = bsArray.map(bs => new this(bs))
      return applications
    }

    //
    // CREATE
    //

    static async create (fields) {
      fields.stack = JSON.stringify(fields.stack) // stupidddd
      const bs = await new BsModel(fields).save(null, {
        method: 'insert',
      })
      await bs.fetch()
      return new this(bs)
    }
  }
}
