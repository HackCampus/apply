const {User, errors} = require('../../database')

// make sure `passReqToCallback: true` in your strategy!
module.exports = provider =>
  function oauthVerifyCallback (req, accessToken, refreshToken, profile, done) {
    const user = req.user
    if (user) {
      const email = user.get('email')
      const {id} = profile
      const authentication = {
        type: provider,
        userId: user.id,
        identifier: id,
        token: accessToken,
      }
      return user.updateAuthentication(authentication)
        .then(() => done(null, user))
        .catch(error => {
          if (error instanceof errors.DuplicateKey) {
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
