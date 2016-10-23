const {Authentication, User} = require('../../models')

// make sure `passReqToCallback: true` in your strategy!
module.exports = provider =>
  function oauthVerifyCallback (req, accessToken, refreshToken, profile, done) {
    const {emails} = profile
    const email = emails[0].value // passport profile normalisation making things difficult...
    if (req.user) {
      Authentication.where({
        type: provider,
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
              type: provider,
              userId: req.user.id,
              identifier: email,
              token: accessToken
            }).save()
          }
        })
        .then(() => done(null, req.user))
        .catch(err => done(err))
    } else {
      User.createWithToken(email, accessToken, provider)
        .then(user => done(null, user))
        .catch(err => done(err))
    }
  }
