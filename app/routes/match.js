const errors = require('../database/errors')

const limitToMatchers = require('../middlewares/limitToMatchers')
const validate = require('../middlewares/validate')

const wireFormats = require('../wireFormats')
const constants = require('../constants')

module.exports = models => {
  const {ApplicationSane: Application, ApplicationEvent} = models

  function routes (app) {
    app.get('/applications', limitToMatchers(), handleGetApplications)
    app.get('/applications/:id', limitToMatchers(), handleGetSingleApplication)

    app.get('/applications/:id/events',
      limitToMatchers(),
      handleGetApplicationEvents)
    app.post('/applications/:id/events',
      limitToMatchers(),
      validate(wireFormats.applicationEvent),
      handlePostApplicationEvents)
  }


  async function handleGetApplications (req, res) {
    const applicationModels = await Application.fetchAllCurrent()
    const applications = applicationModels.map(a => a.toJSON())
    return res.json({applications})
  }

  async function handleGetSingleApplication (req, res) {
    const id = req.params.id
    try {
      const application = await Application.fetchById(id)
      const response = application.toJSON()
      const techPreferences = await application.fetchTechPreferences()
      response.techPreferences = techPreferences
      return res.json(response)
    } catch (error) {
      if (error instanceof errors.NotFound) {
        return handleError({status: 'Not Found'})
      }
      return handleError({status: 'Unknown'})
    }
  }

  async function handleGetApplicationEvents (req, res, handleError) {
    const applicationId = req.params.id
    try {
      // only needed to verify that the url is a real application
      const application = await Application.fetchById(applicationId)
      const applicationEvents = await ApplicationEvent.fetchByApplicationId(application.id)
      const response = {events: applicationEvents.map(e => e.toJSON())}
      return res.json(response)
    } catch (error) {
      if (error instanceof errors.NotFound) {
        return handleError({status: 'Not Found'})
      }
      return handleError({status: 'Unknown'})
    }
  }

  async function handlePostApplicationEvents (req, res, handleError) {
    const applicationId = req.params.id
    const actorId = req.user.id
    const body = req.body
    try {
      // only needed to verify that the url is a real application
      const application = await Application.fetchById(applicationId)
      const event = Object.assign({actorId, applicationId: application.id}, body)
      await ApplicationEvent.create(event)
      const applicationEvents = await ApplicationEvent.fetchByApplicationId(application.id)
      const response = {events: applicationEvents.map(e => e.toJSON())}
      return res.json(response)
    } catch (error) {
      if (error instanceof errors.NotFound) {
        return handleError({status: 'Not Found'})
      }
      return handleError({status: 'Unknown'})
    }
  }

  return {
    routes,
  }
}
