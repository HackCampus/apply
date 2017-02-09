const errors = require('../database/errors')

const limitToMatchers = require('../middlewares/limitToMatchers')
const validate = require('../middlewares/validate')

const wireFormats = require('../wireFormats')
const constants = require('../constants')

module.exports = models => {
  const {ApplicationSane: Application, ApplicationEvent} = models

  function routes (app) {
    app.get('/applications', limitToMatchers(), handleGetApplications(Application.fetchAllCurrent))
    app.get('/applications/events', limitToMatchers(), handleGetAllApplicationEvents)
    app.get('/applications/unfinished', limitToMatchers(), handleGetApplications(Application.fetchAllUnfinished))
    app.get('/applications/finished', limitToMatchers(), handleGetApplications(Application.fetchAllFinished))
    app.get('/applications/vetted', limitToMatchers(), handleGetApplications(Application.fetchAllVetted))
    app.get('/applications/readytomatch', limitToMatchers(), handleGetApplications(Application.fetchAllReadyToMatch))
    app.get('/applications/matching', limitToMatchers(), handleGetApplications(Application.fetchAllMatching))
    app.get('/applications/offer', limitToMatchers(), handleGetApplications(Application.fetchAllOffer))
    app.get('/applications/in', limitToMatchers(), handleGetApplications(Application.fetchAllIn))
    app.get('/applications/out', limitToMatchers(), handleGetApplications(Application.fetchAllOut))

    app.get('/applications/:id', limitToMatchers(), handleGetSingleApplication)
    app.get('/applications/:id/events', limitToMatchers(), handleGetApplicationEvents)
    app.post('/applications/:id/events', limitToMatchers(), validate(wireFormats.applicationEvent), handlePostApplicationEvents)
    app.delete('/applications/:applicationId/events/:eventId', limitToMatchers(), handleDeleteApplicationEvent)
  }

  function handleGetApplications (fetchFunction) {
    return async (req, res) => {
      const applicationModels = await fetchFunction()
      const applications = applicationModels.map(a => a.toJSON())
      return res.json({applications})
    }
  }

  async function handleGetSingleApplication (req, res, handleError) {
    const id = req.params.id
    if (Number.isNaN(Number.parseInt(id))) {
      return handleError({status: 'Not Found'})
    }
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

  async function handleGetAllApplicationEvents (req, res, handleError) {
    const applicationEvents = await ApplicationEvent.fetchAll() // TODO paginate
    const events = applicationEvents.map(e => e.toJSON())
    return res.json({events})
  }

  async function handleGetApplicationEvents (req, res, handleError) {
    const applicationId = req.params.id
    try {
      // only needed to verify that the url is a real application
      const application = await Application.fetchById(applicationId)
      const response = await getApplicationEventsResponse(application.id)
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
      const response = await getApplicationEventsResponse(application.id)
      return res.json(response)
    } catch (error) {
      if (error instanceof errors.NotFound) {
        return handleError({status: 'Not Found'})
      }
      return handleError({status: 'Unknown'})
    }
  }

  async function handleDeleteApplicationEvent (req, res, handleError) {
    const userId = req.user.id
    const {applicationId, eventId} = req.params
    try {
      const event = await ApplicationEvent.fetchById(eventId)
      if (event.applicationId != applicationId) {
        return handleError({status: 'Bad Request', message: 'The given event does not correspond to the given application'})
      }
      const actor = await event.fetchActor()
      if (actor.id != userId) {
        return handleError({status: 'Unauthorized'})
      }
      await event.delete()
      const response = await getApplicationEventsResponse(applicationId)
      return res.json(response)
    } catch (error) {
      if (error instanceof errors.NotFound) {
        return handleError({status: 'Not Found'})
      }
    }
  }

  async function getApplicationEventsResponse (applicationId) {
    const applicationEvents = await ApplicationEvent.fetchByApplicationId(applicationId)
    const response = {events: applicationEvents.map(e => e.toJSON())}
    return response
  }

  return {
    routes,
  }
}
