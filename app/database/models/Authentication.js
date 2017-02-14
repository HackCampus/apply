const UserModel = require('./User')

module.exports = bsModels => {

  const BsModel = bsModels.Authentication
  const User = UserModel(bsModels)

  return class Authentication {
    constructor (bs) {
      this.bs = bs == null ? new BsModel() : bs
    }

    toJSON () {
      const bsJson = this.bs.toJSON({
        shallow: true, // do not include relations - explicitly fetch them instead.
      })
    }

    //
    // GETTERS
    //

    get id () {
      return this.bs.id
    }

    get type () {
      return this.bs.get('type')
    }

    get identifier () {
      return this.bs.get('identifier')
    }

    get token () {
      return this.bs.get('token')
    }

    get userId () {
      return this.bs.get('userId')
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

    //
    // RELATIONS
    //

    async fetchUser () {
      return User.fetchById(this.userId)
    }
  }
}
