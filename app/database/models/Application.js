const shortid = require('shortid')

const constants = require('../../constants')

const errors = require('../errors')

const ApplicationEventModel = require('./ApplicationEvent')
const applicationEvents = require('./applicationEvents')

// TODO move this somewhere more suitable.
// Should probably unify applicationEvents.js & applicationStages.js & this.
const stagesToEvents = {
  unfinished: null,
  finished: null,
  shortlisted: [
    applicationEvents.shortlisted.type,
    applicationEvents.shortlistedVeryStrong.type,
  ],
  readyToMatch: [
    applicationEvents.gaveCompanyPreferences.type,
    applicationEvents.madeMatchSuggestion.type,
  ],
  matching: [
    applicationEvents.sentToCompany.type,
    applicationEvents.arrangedInterviewWithCompany.type,
    applicationEvents.companyRejected.type,
  ],
  offer: [
    applicationEvents.companyMadeOffer.type,
    applicationEvents.acceptedOffer.type,
    applicationEvents.sentContract.type,
  ],
  in: [
    applicationEvents.signedContract.type,
    applicationEvents.finalised.type,
  ],
  out: [
    applicationEvents.rejected.type,
    applicationEvents.applicantRejected.type,
  ],
}

module.exports = (bsModels, knex) => {

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

    static async fetchFiltered (filters) {
      let rows = []

      const programmeYears = filters.programmeYears
      if (Array.isArray(programmeYears) && programmeYears.length > 0) {
        const query = knex.select('applications.id')
          .from('applications')
          .where('programmeYear', 'in', programmeYears)
        const yearsRows = await query
        // If a filter is added before this, `rows` needs to be filtered properly, as below.
        rows = yearsRows
      }

      const techs = filters.techs
      if (Array.isArray(techs) && techs.length > 0) {
        const techRows = await knex.select('applications.id')
          .from('applications')
          .innerJoin('techpreferences', 'applications.id', 'techpreferences.applicationId')
          .whereIn('techpreferences.technology', techs)
          .where('techpreferences.preference', '>', 2)
        rows = rows.concat(techRows)
      }

      const stages = filters.stages
      if (Array.isArray(stages) && stages.length > 0) {
        let events = []
        let doNullQuery = false

        for (let stage of stages) {
          const stageEvents = stagesToEvents[stage]
          if (Array.isArray(stageEvents)) {
            events = events.concat(stageEvents)
          } else if (stageEvents === null) {
            doNullQuery = true
          }
        }

        let query = knex.select(['applications.id', 'applications.finishedAt'])
          .from('applications')
          .leftOuterJoin('applicationevents', 'applications.id', 'applicationevents.applicationId')

        if (events.length > 0) {
          query = query.whereIn('applicationevents.type', events)
        }

        if (doNullQuery) {
          query = query.whereNull('applicationevents.type')
        }

        // AND relation between filters
        if (rows.length > 0) {
          const filteredIds = rows.map(row => row.id)
          query = query.whereIn('applications.id', filteredIds)
          // Query result will be a subset of `rows`.
          rows = []
        }

        const stagesRows = await query
        for (let row of stagesRows) {
          const status = await ApplicationEvent.fetchStatusByApplicationId(row.id)
          if (status === null) {
            // `finished` and `unfinished` both don't have any application events, so `status` is null.
            // we have to look at the finish time to see if the application is unfinished/finished.
            const rowStage = row.finishedAt === null ? 'unfinished' : 'finished'
            if (stages.indexOf(rowStage)) {
              rows.push(row)
            }
          }
          if (events.indexOf(status == null ? null : status.type) !== -1) {
            rows.push(row)
          }
        }
      }

      return Promise.all(rows.map(async ({id}) => {
        const application = await Application.fetchById(id)
        await application.fetchStatus()
        return application
      }))
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
