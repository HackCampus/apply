const isEmpty = require('lodash.isempty')

const authorized = require('../middlewares/authorized')
const validate = require('../middlewares/validate')

const {Application} = require('../models')
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


module.exports = function (app) {
  app.get('/users/:userId/application', (req, res, handleError) => {
    Application.where({userId: req.params.userId}).fetch()
      .then(application => {
        if (application) {
          res.json(formatApplicationObject(application.toJSON()))
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
}
