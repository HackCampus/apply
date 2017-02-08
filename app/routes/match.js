const limitToMatchers = require('../middlewares/limitToMatchers')

const constants = require('../constants')

module.exports = models => {
  const {ApplicationSane: Application} = models

  function routes (app) {
    app.get('/applications', limitToMatchers(), handleGetApplications)
    app.get('/applications/:id', limitToMatchers(), handleGetSingleApplication)
  }


  async function handleGetApplications (req, res) {
    const applicationModels = await Application.fetchAllCurrent()
    const applications = applicationModels.map(a => a.toJSON())
    return res.json({applications})
  }

  async function handleGetSingleApplication (req, res) {
    const id = req.params.id
    const application = await Application.fetchById(id)
    const response = application.toJSON()
    const techPreferences = await application.fetchTechPreferences()
    console.log(techPreferences)
    response.techPreferences = techPreferences
    return res.json(response)
  }

  return {
    routes,
  }
}
