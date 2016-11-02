const isEmpty = require('lodash/isempty')

const constants = require('../constants')

const authorized = require('../middlewares/authorized')
const validate = require('../middlewares/validate')

const {Database, Application, TechPreference} = require('../models')
const wireFormats = require('../wireFormats')

module.exports = function (app) {
  app.get('/me/application',
    authorized,
    getApplication)

  app.put('/me/application',
    authorized, validate(wireFormats.application),
    putApplication)

  app.put('/me/application/techpreferences',
    authorized, validate(wireFormats.techPreferences),
    putTechPreferences)
}

// Application - handlers

function getApplication (req, res, handleError) {
  const userId = req.user.id
  Application.where({userId, programmeYear: constants.programmeYear}).fetch()
    .then(application => {
      if (application) return application
      // There was no application from this year, but there might be one from a previous year.
      return Application.where({userId}).fetch()
    })
    .then(application => {
      if (application) return application
      throw {status: 'Not Found'}
    })
    .then(sendApplication(res))
    .catch(error => {
      if (error instanceof Error) {
        console.log(error)
        handleError({status: 'Internal Server Error'})
      } else {
        handleError(error)
      }
    })
}

function putApplication (req, res, handleError) {
  if (req.body.finished) {
    delete req.body.finished
    return handleApplicationFinish(req, res, handleError)
  } else {
    return handleApplicationUpdate(req, res, handleError)
  }
}

function handleApplicationFinish (req, res, handleError) {
  return updateApplication(req.user.id, req.body)
    .then(application => {
      const {finished, errors} = verifyFinished(application)
      if (finished) {
        return finishApplication(application)
          .then(sendApplication(res))
      } else {
        return handleError({
          status: 'Bad Request',
          error: {errors},
        })
      }
    })
    .catch(err => {
      console.log(err)
      handleError({status: 'Internal Server Error'})
    })
}

function handleApplicationUpdate (req, res, handleError) {
  return updateApplication(req.user.id, req.body)
    .then(sendApplication(res))
    .catch(err => {
      console.log(err)
      handleError({status: 'Internal Server Error'})
    })
}

// Application - helpers

function verifyFinished (application) {
  wireFormats.optionalFields
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

function updateApplication (userId, update) {
  const application = Application.where({userId}).fetch()
    .then(upsertApplication(userId))
  return isEmpty(update)
    ? application
    : application.then(a => a.save(update, {patch: true}))
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
    return new Application({userId, programmeYear: constants.programmeYear}).save()
  }
}

function sendApplication (res) {
  return application => {
    const applicationObject = formatApplicationObject(application.serialize())
    return getTechPreferences(application.id).then(techPreferences => {
      applicationObject.techPreferences = techPreferences
      res.json(applicationObject)
    })
  }
}

// Tech preferences - handlers

function putTechPreferences (req, res, handleError) {
  updateTechPreferences(req.user.id, req.body)
    .then(techPreferences => { res.json(techPreferences) })
    .catch(err => {
      console.log(err)
      handleError({status: 'Internal Server Error'})
    })
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
  return Application.where({userId}).fetch()
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
