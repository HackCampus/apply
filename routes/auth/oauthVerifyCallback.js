const {Authentication, User} = require('../../database')

// make sure `passReqToCallback: true` in your strategy!
module.exports = provider =>
  function oauthVerifyCallback (req, accessToken, refreshToken, profile, done) {
    if (req.user) {
      const {id} = profile
      Authentication.where({
        type: provider,
        userId: req.user.id,
      }).fetch()
        .then(auth => {
          if (auth) {
            return auth.save({
              identifier: id,
              token: accessToken,
            }, {patch: true})
          } else {
            return new Authentication({
              type: provider,
              userId: req.user.id,
              identifier: id,
              token: accessToken
            }).save()
          }
        })
        .then(() => done(null, req.user))
        .catch(error => {
          if (error.constraint === 'authentication_type_identifier_unique') {
            return done(null, false, {message: 'A different user has already connected this account - is it yours?'})
          }
        })
    } else {
      const {emails, id} = profile
      const email = emails[0].value // passport profile normalisation making things difficult...
      User.createWithToken(provider, email, id, accessToken)
        .then(user => done(null, user))
        .catch(error => done(error))
    }
  }
