const {Authentication, User} = require('../../models')

// make sure `passReqToCallback: true` in your strategy!
module.exports = provider =>
  function oauthVerifyCallback (req, accessToken, refreshToken, profile, done) {
    const {id} = profile
    if (req.user) {
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
      User.createWithToken(email, accessToken, provider)
        .then(user => done(null, user))
        .catch(error => done(error))
    }
  }
