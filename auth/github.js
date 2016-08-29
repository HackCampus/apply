const GitHubStrategy = require('passport-github2')

const config = require('../../config')

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

  app.get('/auth/github', passport.authenticate('github'))
  app.get('/auth/github/callback', passport.authenticate('github'))
}
