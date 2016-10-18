const GitHubStrategy = require('passport-github2')

const config = require('../../config')

function setReturnTo (req, res, next) {
  req.session.returnTo = req.headers.referer
  next()
}

module.exports = (passport, app) => {
  passport.use(new GitHubStrategy({
    clientID: config.github.clientId,
    clientSecret: config.github.clientSecret,
    callbackURL: `${config.host}/auth/github/callback`,
    scope: config.github.scope,
  }, (accessToken, refreshToken, profile, done) => {
    console.log('access', accessToken)
    console.log('refresh', refreshToken)
    console.log('profile', profile)
  }))

  app.get('/auth/github', setReturnTo, passport.authenticate('github'))
  app.get('/auth/github/callback', passport.authenticate('github', {successReturnToOrRedirect: '/'}))
}
