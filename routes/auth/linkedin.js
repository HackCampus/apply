const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy

const config = require('../../../config')

const setReturnTo = require('./setReturnTo')
const verify = require('./oauthVerifyCallback')

module.exports = (passport, app) => {
  passport.use(new LinkedInStrategy({
    clientID: config.linkedin.clientId,
    clientSecret: config.linkedin.clientSecret,
    callbackURL: `${config.host}/auth/linkedin/callback`,
    scope: config.linkedin.scope,
    passReqToCallback: true,
    state: true, // required by linkedin, see https://github.com/auth0/passport-linkedin-oauth2#auto-handle-state-param
  }, verify('linkedin')))

  app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/',
  }))

  app.get('/auth/linkedin', setReturnTo, passport.authenticate('linkedin'))
  app.get('/connect/linkedin', setReturnTo, passport.authorize('linkedin'))
}
