const isEmpty = require('lodash/isempty')

const authorized = require('../middlewares/authorized')
const validate = require('../middlewares/validate')

const {Database, Application, TechPreference} = require('../models')
const wireFormats = require('../wireFormats')

function updateApplication (userId, update) {
  const application = Application.where({userId}).fetch()
    .then(application => {
      if (!application) {
        return new Application({userId}).save()
      }
      return application
    })
  if (isEmpty(update)) {
    return application
  } else {
    return application.then(a => a.save(update, {patch: true}))
  }
}

function formatApplicationObject (application) {
  if (application.dateOfBirth instanceof Date) {
    application.dateOfBirth = application.dateOfBirth.toISOString().substr(0, 10)
  }
  return application
}

function handleApplicationUpdate (req, res, handleError) {
  updateApplication(req.user.id, req.body)
    .then(application => formatApplicationObject(application.toJSON()))
    .then(application => { res.json(application) })
    .catch(err => {
      console.log(err)
      handleError({status: 'Internal Server Error'})
    })
}

function getTechPreferences(applicationId) {
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

function handleTechPreferencesUpdate (req, res, handleError) {
  updateTechPreferences(req.user.id, req.body)
    .then(techPreferences => { res.json(techPreferences) })
    .catch(err => {
      console.log(err)
      handleError({status: 'Internal Server Error'})
    })
}

module.exports = function (app) {
  app.get('/users/:userId/application', (req, res, handleError) => {
    Application.where({userId: req.params.userId}).fetch()
      .then(application => {
        if (application) {
          const applicationObject = formatApplicationObject(application.serialize())
          return getTechPreferences(application.id).then(techPreferences => {
            applicationObject.techPreferences = techPreferences
            res.json(applicationObject)
          })
        } else {
          handleError({status: 'Not Found'})
        }
      })
      .catch(error => {
        console.log(error)
        handleError({status: 'Internal Server Error'})
      })
  })

  app.get('/me/application', authorized, (req, res, handleError) => {
    res.redirect(`/users/${req.user.id}/application`)
  })

  app.put('/me/application',
    authorized, validate(wireFormats.application),
    handleApplicationUpdate)

  app.put('/me/application/techpreferences',
    authorized, validate(wireFormats.techPreferences),
    handleTechPreferencesUpdate)

  // FIXME
  app.put('/test/techpreferences', validate(wireFormats.techPreferences),
  (req, res) => { req.user = {}; req.user.id = 1 },
  handleTechPreferencesUpdate)
}
