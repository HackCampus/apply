const GitHubStrategy = require('passport-github2')

const env = require('../../env')

const setReturnTo = require('./setReturnTo')
const verify = require('./oauthVerifyCallback')

module.exports = (passport, app) => {
  passport.use(new GitHubStrategy({
    clientID: env.github.clientId,
    clientSecret: env.github.clientSecret,
    callbackURL: `${env.host}/auth/github/callback`,
    scope: env.github.scope,
    passReqToCallback: true,
  }, verify('github')))

  app.get('/auth/github/callback', passport.authenticate('github', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/auth/error',
  }))

  app.get('/auth/github', setReturnTo, passport.authenticate('github'))
  app.get('/connect/github', setReturnTo, passport.authorize('github'))
}
