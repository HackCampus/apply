const limitToMatchers = require('../middlewares/limitToMatchers')

const constants = require('../constants')

module.exports = models => {
  const {Application} = models

  function routes (app) {
    app.get('/applications', limitToMatchers(), getApplicationsHandler)
  }


  function getApplicationsHandler (req, res) {
    return getApplications()
      .then(applications => {
        return applications.toJSON()
      })
      .then(applications => res.json(applications))
  }

  function getApplications () {
    return Application.where('programmeYear', '=', '2017').fetchAll()
  }

  return {
    routes,
  }
}
