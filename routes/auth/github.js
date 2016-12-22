const GitHubStrategy = require('passport-github2')

const env = require('../../env')
const logger = require('../../logger')

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
  }), (err, req, res, next) => {
    if (err) {
      if (err.name === 'InternalOAuthError') {
        // TODO how to handle this properly?
        res.redirect('/')
        logger.error(err)
        return next()
      } else {
        return next(err)
      }
    }
    return next()
  })

  app.get('/auth/github', setReturnTo, passport.authenticate('github'))
  app.get('/connect/github', setReturnTo, passport.authorize('github'))
}
