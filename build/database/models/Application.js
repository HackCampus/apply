

const moment = require('moment');
const shortid = require('shortid');

const contains = require('../../lib/contains');
const intersection = require('../../lib/intersection');
const logger = require('../../lib/logger');

const constants = require('../../constants');

const errors = require('../errors');

const ApplicationEventModel = require('./ApplicationEvent');
const TechPreferenceModel = require('./TechPreference');
const applicationEvents = require('./applicationEvents');
const definitelyTransactFactory = require('./definitelyTransact');

// TODO move this somewhere more suitable.
// Should probably unify applicationEvents.js & applicationStages.js & this.
const stagesToEvents = {
  unfinished: null,
  finished: null,
  shortlisted: [applicationEvents.shortlisted.type, applicationEvents.shortlistedVeryStrong.type],
  readyToMatch: [applicationEvents.gaveCompanyPreferences.type, applicationEvents.madeMatchSuggestion.type],
  matching: [applicationEvents.sentToCompany.type, applicationEvents.arrangedInterviewWithCompany.type, applicationEvents.companyRejected.type],
  offer: [applicationEvents.companyMadeOffer.type, applicationEvents.acceptedOffer.type, applicationEvents.sentContract.type],
  in: [applicationEvents.signedContract.type, applicationEvents.finalised.type],
  out: [applicationEvents.rejected.type, applicationEvents.applicantRejected.type]
};

module.exports = (bsModels, knex) => {

  const BsModel = bsModels.Application;
  const TechPreference = TechPreferenceModel(bsModels);
  const ApplicationEvent = ApplicationEventModel(bsModels);
  const definitelyTransact = definitelyTransactFactory(bsModels);

  return class Application {
    constructor(bs) {
      this.bs = bs == null ? new BsModel() : bs;
    }

    //
    // GETTERS
    //

    get id() {
      return this.bs.id;
    }

    get finishedAt() {
      return this.bs.get('finishedAt');
    }

    get programmeYear() {
      return this.bs.get('programmeYear');
    }

    //
    // FETCH
    //

    static async fetchById(id) {
      const bs = await BsModel.where('id', '=', id).fetch();
      return new this(bs);
    }

    static async fetchSingle(...query) {
      const bs = await BsModel.where(...query).fetchAll();
      if (bs.length === 0) {
        throw new errors.NotFound();
      } else if (bs.length > 1) {
        console.trace(`ambiguous query in fetchSingle, returned ${bs.length} objects, not 1:`, ...query);
      }
      const b = bs.at(0);
      return new this(b);
    }

    // Returns the application with the latest application year belonging to the given user.
    // Returns null if the user has no applications.
    static async fetchLatest(userId) {
      const bs = await BsModel.where({ userId }).orderBy('programmeYear', 'DESC').fetch();
      if (bs == null) {
        return null;
      }
      return new this(bs);
    }

    static async fetchByProfileToken(profileToken) {
      return Application.fetchSingle({ profileToken });
    }

    static async fetchAll(...query) {
      const bsModel = query.length > 0 ? BsModel.where(...query) : BsModel;
      const bs = await bsModel.fetchAll();
      const bsArray = bs.toArray();
      const models = bsArray.map(bs => new this(bs));
      return models;
    }

    static async fetchAllCurrent() {
      return Application.fetchAll({ programmeYear: constants.programmeYear });
    }

    static async fetchAllUnfinished() {
      return Application.fetchAll({ programmeYear: constants.programmeYear, finishedAt: null });
    }

    static async fetchFiltered({ programmeYears, techs, stages, genders }) {
      let ids = null;

      if (filteringBy(programmeYears)) {
        const yearsIds = await Application._idsFilteredByProgrammeYears(programmeYears);
        ids = new Set(yearsIds);
      }

      if (filteringBy(techs)) {
        const techIds = await Application._idsFilteredByTechPreferences(techs);
        ids = ids ? intersection(ids, techIds) : techIds;
      }

      if (filteringBy(stages)) {
        const stagesIds = await Application._idsFilteredByApplicationStages(stages);
        ids = ids ? intersection(ids, stagesIds) : stagesIds;
      }

      if (filteringBy(genders)) {
        const gendersIds = await Application._idsFilteredByGenders(genders);
        ids = ids ? intersection(ids, gendersIds) : gendersIds;
      }

      ids = ids || new Set();

      const applications = [];
      for (let id of ids) {
        const application = await Application.fetchById(id);
        await application.fetchStatus();
        applications.push(application);
      }
      return applications;

      function filteringBy(field) {
        return Array.isArray(field) && field.length > 0;
      }
    }

    static async _idsFilteredByProgrammeYears(programmeYears) {
      if (!Array.isArray(programmeYears)) {
        programmeYears = [programmeYears];
      }
      const rows = await knex.select('applications.id').from('applications').where('programmeYear', 'in', programmeYears);
      return rows.map(row => row.id);
    }

    static async _idsFilteredByTechPreferences(techs) {
      if (!Array.isArray(techs)) {
        techs = [techs];
      }
      const rows = await knex.select('applications.id').from('applications').innerJoin('techpreferences', 'applications.id', 'techpreferences.applicationId').whereIn('techpreferences.technology', techs).where('techpreferences.preference', '>', 2);
      return rows.map(row => row.id);
    }

    static async _idsFilteredByApplicationStages(stages) {
      if (!Array.isArray(stages)) {
        stages = [stages];
      }

      let ids = [];
      let events = [];
      let doNullQuery = false;

      for (let stage of stages) {
        const stageEvents = stagesToEvents[stage];
        if (Array.isArray(stageEvents)) {
          events = events.concat(stageEvents);
        } else if (stageEvents === null) {
          doNullQuery = true;
        }
      }

      let query = knex.select(['applications.id', 'applications.finishedAt']).from('applications').leftOuterJoin('applicationevents', 'applications.id', 'applicationevents.applicationId');

      if (events.length > 0) {
        query = query.whereIn('applicationevents.type', events);
      }

      if (doNullQuery) {
        query = query.whereNull('applicationevents.type');
      }

      const stagesRows = await query;
      for (let { id, finishedAt } of stagesRows) {
        const status = await ApplicationEvent.fetchStatusByApplicationId(id);
        if (status === null) {
          // `finished` and `unfinished` both don't have any application events, so `status` is null.
          // we have to look at the finish time to see if the application is unfinished/finished.
          const rowStage = finishedAt === null ? 'unfinished' : 'finished';
          if (contains(stages, rowStage)) {
            ids.push(id);
          }
        }
        const statusType = status == null ? null : status.type;
        if (contains(events, statusType)) {
          ids.push(id);
        }
      }

      return ids;
    }

    static async _idsFilteredByGenders(genders) {
      if (!Array.isArray(genders)) {
        genders = [genders];
      }
      const rows = await knex.select('applications.id').from('applications').where('gender', 'in', genders);
      return rows.map(row => row.id);
    }

    //
    // RELATIONS
    //

    async fetchTechPreferences() {
      const techPreferences = await TechPreference.fetchAllByApplication(this.id);
      return techPreferences;
    }

    async fetchStatus() {
      const status = await ApplicationEvent.fetchStatusByApplicationId(this.id);
      this.status = status;
      return status;
    }

    //
    // CREATE
    //

    static async create(userId, fields, transaction) {
      return await definitelyTransact(transaction, async transaction => {
        const profileToken = shortid.generate();
        const required = { userId, programmeYear: constants.programmeYear, profileToken };
        const bs = await new BsModel(required).save(null, {
          method: 'insert',
          transacting: transaction
        });
        await bs.fetch({ transacting: transaction });
        const application = new this(bs);
        return await application.update(fields, transaction);
      });
    }

    //
    // UPDATE
    //

    async update(fields, transaction) {
      return await definitelyTransact(transaction, async transaction => {
        if (this.finishedAt != null) {
          throw new errors.ApplicationFinished();
        }
        if (fields == null || Object.keys(fields).length == 0) {
          return this;
        }
        if ('techPreferences' in fields) {
          const preferences = [];
          for (let technology in fields.techPreferences) {
            preferences.push({ technology, preference: fields.techPreferences[technology] });
          }
          for (let preference of preferences) {
            await TechPreference.create(this.id, preference, transaction);
          }
          delete fields.techPreferences;
        }
        if ('status' in fields) {
          delete fields.status;
        }
        fields.updatedAt = new Date();
        const bs = await new BsModel({ id: this.id }).save(fields, {
          method: 'update',
          transacting: transaction,
          patch: true
        });
        await bs.fetch({ transacting: transaction });
        this.bs = bs;
        return this;
      });
    }

    // Updates a given user's application if it is from the current year,
    // or creates a new application, copying the user's previous answers if
    // the user already applied in previous years.
    static async updateOrRenew(userId, fields, transaction) {
      return await definitelyTransact(transaction, async transaction => {
        const latest = await Application.fetchLatest(userId, transaction);
        if (!latest) {
          return await Application.create(userId, fields, transaction);
        }
        if (latest.programmeYear !== constants.programmeYear) {
          logger.info({ userId }, 'applicant from previous year started a new application');
          const oldFields = await latest.materialize();
          const updatedFields = Object.assign({}, oldFields, fields);
          delete updatedFields.id;
          delete updatedFields.createdAt;
          delete updatedFields.updatedAt;
          delete updatedFields.finishedAt;
          delete updatedFields.profileToken;
          delete updatedFields.programmeYear;
          delete updatedFields.status;
          const newApplication = await Application.create(userId, updatedFields, transaction);
          return newApplication;
        }
        return latest.update(fields, transaction);
      });
    }

    //
    // MATERIALIZE
    //

    // toJSON does not include relations - you have to explicitly fetch them instead.
    toJSON() {
      return this.bs.toJSON({
        shallow: true
      });
    }

    // Returns a JSON object of the full model, ready to be sent over the wire.
    async materialize() {
      let application = this.toJSON();
      application.status = await this.fetchStatus();
      application.techPreferences = await this.fetchTechPreferences();
      // Only return YYYY-MM-DD string rather than full datetime.
      // BST is UTC+1, ie. 1111-11-11 == 1111-11-11T00:00:00+01:00 == 1111-11-10T23:00:00Z
      // So we can't use the native Date.toISOString and truncate because this returns dates in UTC,
      // and we would get back a date that is the day before the entered birthday!
      if (application.dateOfBirth instanceof Date) {
        application.dateOfBirth = moment(application.dateOfBirth).format('YYYY-MM-DD');
      }
      return application;
    }
  };
};