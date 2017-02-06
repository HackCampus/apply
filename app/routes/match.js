const limitToMatchers = require('../middlewares/limitToMatchers')

const constants = require('../constants')

module.exports = models => {
  const {Application} = models

  function routes (app) {
    app.get('/applications', limitToMatchers(), getApplicationsHandler)
    app.get('/applications/:id', limitToMatchers(), getSingleApplicationHandler)
  }


  function getApplicationsHandler (req, res) {
    return getApplications()
      .then(applications => res.json(applications.toJSON()))
  }

  function getSingleApplicationHandler (req, res) {
    const id = req.params.id
    return getApplication({id})
      .then(applications => res.json(applications.toJSON()))
  }

  function getApplications () {
    return Application.where('programmeYear', '=', '2017').fetchAll()
  }

  function getApplication (filters) {
    return new Application(filters).fetch()
  }

  return {
    routes,
  }
}
