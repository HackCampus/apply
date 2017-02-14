const constants = require('../constants')
const roles = require('../roles')

const companies = require('../../../companies') // TODO

module.exports = models => {
  const {ApplicationSane: Application} = models

  function routes (app) {
    app.get('/companies', limitToSuccessfulApplicants, handleGetCompanies)
    // app.get('/me/companies')
    app.put('/me/companies', limitToSuccessfulApplicants, handlePutCompanyPreferences)
  }

  async function limitToSuccessfulApplicants (req, res, next) {
    if (req.user == null) {
      return next({status: 'Unauthorized'})
    }
    const user = req.user
    const role = user.role
    if (role === roles.applicant) {
      const application = await Application.fetchSingle({userId: user.id, programmeYear: constants.programmeYear})
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
    res.status(200)
    res.json({
      companies,
    })
  }

  function handlePutCompanyPreferences (req, res, handleError) {

  }

  return {
    routes,
  }
}
