const GitHubStrategy = require('passport-github2')

const config = require('../../../config')

const setReturnTo = require('./setReturnTo')
const verify = require('./oauthVerifyCallback')

module.exports = (passport, app) => {
  passport.use(new GitHubStrategy({
    clientID: config.github.clientId,
    clientSecret: config.github.clientSecret,
    callbackURL: `${config.host}/auth/github/callback`,
    scope: config.github.scope,
    passReqToCallback: true,
  }, verify('github')))

  app.get('/auth/github/callback', passport.authenticate('github', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/auth/error',
  }))

  app.get('/auth/github', setReturnTo, passport.authenticate('github'))
  app.get('/connect/github', setReturnTo, passport.authorize('github'))
}
