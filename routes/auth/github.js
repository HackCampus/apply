const GitHubStrategy = require('passport-github2')

const {Authentication, User} = require('../../models')
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
    passReqToCallback: true,
  }, (req, accessToken, refreshToken, profile, done) => {
    const {emails} = profile
    const email = emails[0].value // passport profile normalisation making things difficult...
    if (req.user) {
      Authentication.where({
        type: 'github',
        userId: req.user.id,
      }).fetch()
        .then(auth => {
          if (auth) {
            return auth.save({
              identifier: email,
              token: accessToken,
            }, {patch: true})
          } else {
            return new Authentication({
              type: 'github',
              userId: req.user.id,
              identifier: email,
              token: accessToken
            }).save()
          }
        })
        .then(() => done(null, req.user))
        .catch(err => done(err))
    } else {
      User.createWithToken(email, accessToken, 'github')
        .then(user => done(null, user))
        .catch(err => done(err))
    }
  }))

  app.get('/auth/github/callback', passport.authenticate('github', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/',
  }))

  app.get('/auth/github', setReturnTo, passport.authenticate('github'))
  app.get('/connect/github', setReturnTo, passport.authorize('github'))
}
