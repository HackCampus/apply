const template = require('../templates/profile')
const logger = require('../logger')

module.exports = models => {

  const {ApplicationSane: Application, ApplicationEvent} = models

  function routes (app) {
    app.get('/profile/:token/:ignored', async (req, res, handleError) => {
      const {token} = req.params
      try {
        const application = await Application.fetchByProfileToken(token)
        const applicationJson = application.toJSON()
        delete applicationJson.mostExcitingTechnology
        delete applicationJson.implementation
        delete applicationJson.codeReview
        delete applicationJson.perfectRole
        const commentEvents = await ApplicationEvent.fetchAll({applicationId: application.id, type: 'gavePublicMatcherComment'})
        if (commentEvents.length > 0) {
          const event = commentEvents[0].toJSON()
          applicationJson.matcherComment = event.payload.comment
        }
        res.send(template(applicationJson))
      } catch (e) {
        logger.error(e)
        return handleError({status: 'Not Found'})
      }
    })
  }

  return {
    routes,
  }
}
