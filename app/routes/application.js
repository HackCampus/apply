const isEmpty = require('lodash.isempty')
const extend = require('xtend')

const constants = require('../constants')
const logger = require('../logger')

const authorized = require('../middlewares/authorized')
const validate = require('../middlewares/validate')

const wireFormats = require('../wireFormats')

module.exports = function (models) {
  const {Database, Application, TechPreference} = models

  function routes (app) {
    app.get('/me/application',
      authorized,
      handleGetApplication)

    app.put('/me/application',
      authorized,
      validate(wireFormats.application),
      handlePutApplication)

    app.put('/me/application/techpreferences',
      authorized,
      validate(wireFormats.techPreferences),
      handlePutTechPreferences)
  }

  // Application - handlers

  function handleGetApplication (req, res, handleError) {
    const userId = req.user.id
    return getApplication(userId, handleError)
      .then(sendApplication(res))
      .catch(error => {
        if (error.status != null) {
          return handleError(error)
        } else {
          return internalError(error)
        }
      })
  }

  function handlePutApplication (req, res, handleError) {
    let handler
    if (req.body.finished) {
      logger.info({userId: req.user.id}, 'finishing application')
      delete req.body.finished
      handler = handleFinishApplication
    } else {
      logger.info({userId: req.user.id}, 'updating application')
      handler = handleUpdateApplication
    }
    return handler(req, res)
      .catch(error => {
        if (error.status != null) {
          return handleError(error)
        } else {
          return internalError(error)
        }
      })
  }

  function handleFinishApplication (req, res) {
    return updateApplication(req.user.id, req.body)
      .then(application => {
        const {finished, errors} = verifyFinished(application.toJSON())
        if (finished) {
          return finishApplication(application)
            .then(sendApplication(res))
        } else {
          throw {
            status: 'Bad Request',
            error: {errors},
          }
        }
      })
  }

  function handleUpdateApplication (req, res) {
    return updateApplication(req.user.id, req.body)
      .then(sendApplication(res))
  }

  // Application - helpers
  // Helpers should throw application errors instead of handling them.
  // It is the responsibility of handler functions to handle the errors.

  function getApplication (userId) {
    return fetchCurrentApplication(userId)
      .then(application => {
        if (application) return application
        // There was no application from this year, but there might be one from a previous year.
        // Create a new one.
        return createApplicationFromPreviousYear(userId)
      })
      .then(application => {
        if (application) return application
        throw {status: 'Not Found'}
      })
  }

  // Checks that none of the required fields are empty in the given application.
  // This is a hack to work around the fact that the JSON schema (in wireFormats.js)
  // does not have any required fields set, as we want to do partial updates.
  // Terrible solution - should find a better way to do finished applications.
  function verifyFinished (application) {
    const emptyFields = []
    for (let field in application) {
      if (field === 'updatedAt' || field === 'finishedAt') continue
      const response = application[field]
      if ((response == null || response === '') && !wireFormats.optionalFields[field]) {
        emptyFields.push(field)
      }
    }
    return {
      finished: emptyFields.length === 0,
      errors: emptyFields
    }
  }

  // Updates the fields passed in the `update` parameter in the application
  // corresponding to the user `userId`.
  // If there is no application, or the application is from a previous year,
  // a new application is created for this year.
  function updateApplication (userId, update) {
    const application = fetchCurrentApplication(userId)
      .then(application => {
        if (application) return application
        return createApplicationFromPreviousYear(userId)
      })
      .then(upsertApplication(userId))
    return isEmpty(update)
      ? application
      : application.then(a => a.save(update, {patch: true}))
  }

  // Fetches an application from this year only.
  function fetchCurrentApplication (userId) {
    return Application.where({userId, programmeYear: constants.programmeYear}).fetch()
  }

  // Creates a copy of a previous year's application.
  // If an application from this year exists already, does nothing.
  function createApplicationFromPreviousYear(userId) {
    return Application.where({userId}).orderBy('programmeYear', 'DESC').fetch()
      .then(application => {
        if (!application) return null
        const now = new Date().toJSON()
        const applicationJson = application.toJSON()
        if (applicationJson.programmeYear === constants.programmeYear) {
          logger.error('createApplicationFromPreviousYear was called even though a current application exists')
          return application
        }
        logger.info({userId}, 'creating new application from previous year')
        const newApplication = extend(applicationJson, {
          programmeYear: constants.programmeYear,
          updatedAt: new Date(),
          finishedAt: null,
        })
        // so bad... if we don't remove the id, we'll update the current application rather than creating a new one.
        delete newApplication.id
        return new Application(newApplication).save()
      })
  }

  function finishApplication (application) {
    const now = new Date().toJSON()
    return Application.where('id', application.id).fetch()
      .then(application => application.save({finishedAt: now}, {patch: true}))
  }

  function formatApplicationObject (application) {
    if (application.dateOfBirth instanceof Date) {
      application.dateOfBirth = application.dateOfBirth.toISOString().substr(0, 10)
    }
    return application
  }

  function upsertApplication (userId) {
    return application => {
      if (application) return application
      logger.info({userId}, 'creating new application')
      return new Application({userId, programmeYear: constants.programmeYear}).save()
    }
  }

  function sendApplication (res) {
    return application => {
      if (!application) {
        throw {status: 'Not Found'}
      }
      const applicationObject = formatApplicationObject(application.serialize())
      return getTechPreferences(application.id).then(techPreferences => {
        applicationObject.techPreferences = techPreferences
        res.json(applicationObject)
      })
    }
  }

  function internalError (handleError) {
    return error => {
      logger.error(error)
      return handleError({status: 'Internal Server Error'})
    }
  }

  // Tech preferences - handlers

  function handlePutTechPreferences (req, res, handleError) {
    updateTechPreferences(req.user.id, req.body)
      .then(techPreferences => { res.json(techPreferences) })
      .catch(internalError(handleError))
  }

  // Tech preferences - helpers

  function getTechPreferences (applicationId) {
    return TechPreference.where({applicationId}).fetchAll()
      .then(collection => {
        const preferences = collection.serialize()
        const techPreferences = {}
        for (let p in preferences) {
          const {technology, preference} = preferences[p]
          techPreferences[technology] = preference
        }
        return techPreferences
      })
  }

  function updateTechPreferences (userId, newPreferences) {
    return fetchCurrentApplication(userId)
      .then(maybeApplication => {
        if (!maybeApplication) {
          throw new Error('no application for user with id ' + userId)
        }
        return maybeApplication
      })
      .then(application => {
        return Database.transaction(t => {
          const writes = []
          for (let technology in newPreferences) {
            const preference = newPreferences[technology]
            writes.push({applicationId: application.id, technology, preference})
          }
          return Promise.all(writes.map(write => saveTechPreference(write, t)))
            .then(() => getTechPreferences(application.id))
        })
      })
  }

  function saveTechPreference ({applicationId, technology, preference}, transaction) {
    return TechPreference.where({applicationId, technology})
      .fetch()
      .then(row => {
        if (row) {
          return row.save({preference}, {patch: true, transacting: transaction})
        } else {
          return new TechPreference({applicationId, technology, preference}).save({}, {transacting: transaction})
        }
      })
  }

  return {
    routes,

    testing: {
      createApplicationFromPreviousYear,
      finishApplication,
      getApplication,
      updateApplication,
      updateTechPreferences,
      verifyFinished,
    },
  }
}