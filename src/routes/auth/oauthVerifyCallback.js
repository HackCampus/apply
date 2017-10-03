const {User, errors} = require('../../database')
const logger = require('../../lib/logger')

// make sure `passReqToCallback: true` in your strategy!
module.exports = provider =>
  async function oauthVerifyCallback (req, accessToken, refreshToken, profile, done) {
    const user = req.user
    if (user) {
      const email = user.email
      const {id} = profile
      const authentication = {
        type: provider,
        userId: user.id,
        identifier: id,
        token: accessToken,
      }
      try {
        await user.updateAuthentication(authentication)
        return done(null, user)
      } catch (error) {
        if (error instanceof errors.DuplicateKey) {
          return done(null, false, {message: 'A different user has already connected this account - is it yours?'})
        } else {
          return done(error)
        }
      }
    } else {
      const {emails, id} = profile
      if (emails == null || emails.length < 1) {
        req.log.error(`failed to get an email in ${provider} auth flow.`)
        return done(null, false, {message: 'Did you grant the necessary permissions?'})
      }
      const email = emails[0].value
      try {
        const newUser = await User.createWithToken(provider, email, id, accessToken)
        return done(null, newUser)
      } catch (error) {
        if (error instanceof errors.DuplicateEmail) {
          return done(null, false, {message: 'A different user has already connected this account - is it yours?'})
        }
      }
    }
  }
