const {User, errors} = require('../../database')
const logger = require('../../logger')

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
            logger.error(error, 'duplicate key')
            return done(null, false, {message: 'A different user has already connected this account - is it yours?'})
          } else {
            logger.error(error, 'unknown')
            return done(error)
          }
        })
    } else {
      const {emails, id} = profile
      if (emails == null || emails.length < 1) {
        req.log.error(`failed to get an email in ${provider} auth flow.`)
        return done(null, false, {message: 'Did you grant the necessary permissions?'})
      }
      const email = emails[0].value // passport profile normalisation making things difficult...
      User.createWithToken(provider, email, id, accessToken)
        .then(user => done(null, user))
        .catch(error => done(error))
    }
  }
