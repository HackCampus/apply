const shortid = require('shortid')

const constants = require('../../constants')

const errors = require('../errors')

const ApplicationEventModel = require('./ApplicationEvent')
const applicationEvents = require('./applicationEvents')

module.exports = bsModels => {

  const BsModel = bsModels.Application
  const ApplicationEvent = ApplicationEventModel(bsModels)

  return class Application {
    constructor (bs) {
      this.bs = bs == null ? new BsModel() : bs
    }

    toJSON () {
      const bsJson = this.bs.toJSON({
        shallow: true, // do not include relations - explicitly fetch them instead.
      })
      const status = this.status ? this.status.toJSON() : undefined
      return Object.assign({}, bsJson, {status})
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

    static async fetchByUser (userId) {
      return Application.fetchSingle({userId, programmeYear: constants.programmeYear})
    }

    static async fetchByProfileToken (profileToken) {
      return Application.fetchSingle({profileToken})
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

    static async fetchAllCurrent () {
      return Application.fetchAll({programmeYear: constants.programmeYear})
    }

    static async fetchAllUnfinished () {
      return Application.fetchAll({programmeYear: constants.programmeYear, finishedAt: null})
    }

    static async fetchAllByStatus (statuses) {
      statuses = Array.isArray(statuses) ? statuses : [statuses]
      const bs = await BsModel.query(qb => {
        qb.where('programmeYear', '=', constants.programmeYear)
        qb.whereNotNull('finishedAt')
      }).fetchAll()
      const bsApplications = bs.toArray()
      const applications = []
      for (let bsApplication of bsApplications) {
        const application = new this(bsApplication)
        const status = await application.fetchStatus()
        if (statuses.indexOf(status == null ? status : status.type) !== -1) {
          applications.push(application)
        }
      }
      return applications
    }

    // 'Finished' applications are those that have not yet been vetted/matched/etc.
    static async fetchAllFinished () {
      return Application.fetchAllByStatus([null])
    }

    static async fetchAllShortlisted () {
      return Application.fetchAllByStatus([
        applicationEvents.shortlisted.type,
        applicationEvents.shortlistedVeryStrong.type,
      ])
    }

    static async fetchAllReadyToMatch () {
      return Application.fetchAllByStatus([
        applicationEvents.gaveCompanyPreferences.type,
        applicationEvents.madeMatchSuggestion.type,
      ])
    }

    static async fetchAllMatching () {
      return Application.fetchAllByStatus([
        applicationEvents.sentToCompany.type,
        applicationEvents.arrangedInterviewWithCompany.type,
        applicationEvents.companyRejected.type,
      ])
    }

    static async fetchAllOffer () {
      return Application.fetchAllByStatus([
        applicationEvents.companyMadeOffer.type,
        applicationEvents.acceptedOffer.type,
        applicationEvents.sentContract.type,
      ])
    }

    static fetchAllIn () {
      return Application.fetchAllByStatus([
        applicationEvents.signedContract.type,
        applicationEvents.finalised.type,
      ])
    }

    static async fetchAllOut () {
      return Application.fetchAllByStatus([
        applicationEvents.rejected.type,
        applicationEvents.applicantRejected.type,
      ])
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

    async fetchStatus () {
      const status = await ApplicationEvent.fetchStatusByApplicationId(this.id)
      this.status = status
      return status
    }

    //
    // CREATE
    //

    static async create (fields, transaction) {
      const profileToken = shortid.generate()
      const required = {programmeYear: constants.programmeYear, profileToken}
      const actualFields = Object.assign({}, required, fields)
      const bs = await new BsModel(actualFields).save(null, {
        method: 'insert',
        transacting: transaction,
      })
      await bs.fetch()
      return new this(bs)
    }

    //
    // UPDATE
    //

    async update (fields, transaction) {
      const bs = await new BsModel({id: this.id}).save(fields, {
        method: 'update',
        transacting: transaction,
        patch: true,
      })
      await bs.fetch()
      this.bs = bs
      return this
    }
  }
}
