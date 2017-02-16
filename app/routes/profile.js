const template = require('../templates/profile')
const logger = require('../logger')

module.exports = models => {

  const {ApplicationSane: Application} = models

  function routes (app) {
    app.get('/profile/:token/:ignored', async (req, res, handleError) => {
      const {token} = req.params
      try {
        const application = await Application.fetchByProfileToken(token)
        res.send(template(application.toJSON()))
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
