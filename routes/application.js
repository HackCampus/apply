const authorized = require('../middlewares/authorized')
const validate = require('../middlewares/validate')

const {Application} = require('../models')
const wireFormats = require('../wireFormats')

function updateApplication (userId, update) {
  return Application.where({userId}).fetch()
    .then(application => {
      if (!application) {
        return new Application({userId}).save()
      }
      return application
    })
    .then(application => application.save(update, {patch: true}))
}

function handleApplicationUpdate (req, res, handleError) {
  updateApplication(req.user.id, req.body)
    .then(application => { res.json(application.toJSON()) })
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
          res.json(application.toJSON())
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

  app.put('/me/application/personaldetails',
    authorized, validate(wireFormats.personalDetails),
    handleApplicationUpdate)
}
