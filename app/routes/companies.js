const companies = [] // require('../../../companies') // TODO

const validate = require('../middlewares/validate')

const constants = require('../constants')
const roles = require('../roles')
const wireFormats = require('../wireFormats')

module.exports = models => {
  const {ApplicationSane: Application, ApplicationEvent} = models

  function routes (app) {
    app.get('/companies', limitToSuccessfulApplicants, handleGetCompanies)
    app.get('/me/companies', limitToSuccessfulApplicants, handleGetCompanyPreferences)
    app.put('/me/companies', limitToSuccessfulApplicants, validate(wireFormats.companyPreferences), handlePutCompanyPreferences)
  }

  async function limitToSuccessfulApplicants (req, res, next) {
    if (req.user == null) {
      return next({status: 'Unauthorized'})
    }
    const user = req.user
    const role = user.role
    if (role === roles.applicant) {
      // TODO there should be a better way to get the current application from a user.
      const application = await Application.fetchByUser(user.id)
      req.application = application
      const status = await application.fetchStatus()
      if (status === null) {
        // not vetted yet
        return next({status: 'Unauthorized'})
      }
      if (status.type === 'rejected') {
        return next({status: 'Unauthorized'})
      }
      return next()
    } else if (role === roles.matcher) {
      return next()
    } else {
      return next({status: 'Unknown'})
    }
  }

  function handleGetCompanies (req, res, handleError) {
    res.json({
      companies,
    })
  }

  async function handleGetCompanyPreferences (req, res, handleError) {
    const user = req.user
    const application = req.application
    const events = await ApplicationEvent.fetchAll({actorId: user.id, applicationId: application.id, type: 'gaveCompanyPreferences'})
    if (events.length === 0) {
      return handleError({status: 'Not Found'})
    }
    const event = events[0]
    const preferences = event.payload
    return res.json(preferences)
  }

  async function handlePutCompanyPreferences (req, res, handleError) {
    const user = req.user
    const application = req.application // set by limitToSuccessfulApplicants
    const preferences = req.body
    try {
      await ApplicationEvent.create({actorId: user.id, applicationId: application.id, type: 'gaveCompanyPreferences', payload: preferences})
      return res.json(preferences)
    } catch (e) {
      console.error(e)
      return handleError({status: 'Unknown'})
    }
  }

  return {
    routes,
  }
}
