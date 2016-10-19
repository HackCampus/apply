const GitHubStrategy = require('passport-github2')

const {User} = require('../../models')
const config = require('../../../config')

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
    const {id, emails} = profile
    const email = emails[0].value // passport profile normalisation making things difficult...
    User.createWithGithub(email, accessToken)
      .then(user => done(null, user))
      .catch(err => done(err))
  }))

  app.get('/auth/github', setReturnTo, passport.authenticate('github'))
  app.get('/auth/github/callback', passport.authenticate('github', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/',
  }))
}
