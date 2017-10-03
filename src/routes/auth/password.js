const bcrypt = require('bcrypt')
const {Strategy: LocalStrategy} = require('passport-local')
const pify = require('pify')
const status = require('statuses')

const errors = require('../../errors')
const verifyDjangoHash = require('../../lib/verifyDjangoHash')
const authorized = require('../../middlewares/authorized')
const validateRequest = require('../../middlewares/validate')
const {errors: {DuplicateEmail, NotFound}, User, Authentication} = require('../../database')
const wireFormats = require('../../wireFormats')

const bcrypt_compare = pify(bcrypt.compare)

// Returns a Promise<boolean> which resolves to true iff the given password matches the hash in the database.
function verifyPassword (password, hash) {
  if (hash.startsWith('pbkdf2_sha256')) {
    // old users
    return verifyDjangoHash(password, hash)
  } else {
    // new users
    return bcrypt_compare(password, hash)
  }
}

module.exports = (passport, app) => {
  // Registration
  // errors:
  // 0. junk in
  // 1. email already exists
  app.post('/users', validateRequest(wireFormats.register) /*0*/, async (req, res, handleError) => {
    const {email, password} = req.body
    try {
      const user = await User.createWithPassword(email, password)
      res.status(status('Created'))
      return res.json(user.toJSON())
    } catch (error) {
      if (error instanceof DuplicateEmail) { /*1*/
        return handleError({status: 'Conflict', error: errors.emailTaken})
      }
      return handleError({status: 'Unknown', error})
    }
  })

  // Log-in
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  }, async function handleLogin (email, password, next) {
    const nextError = error => next(error)
    const nextSuccess = user => next(null, user)
    try {
      const authentication = await Authentication.fetchSingle({identifier: email, type: 'password'})
      const hashedPassword = authentication.token
      const passwordsMatch = await verifyPassword(password, hashedPassword)
      if (passwordsMatch) {
        const user = await authentication.fetchUser()
        return nextSuccess(user)
      } else {
        return nextError({status: 'Unauthorized', error: errors.loginIncorrect})
      }
    } catch (error) {
      if (error instanceof NotFound) {
        return nextError({status: 'Unauthorized', error: errors.loginIncorrect})
      }
      return nextError({status: 'Unknown', error: error.message})
    }
  }))

  app.post('/auth/password', passport.authenticate('local'), (req, res) => {
    res.end()
  })

  // Change password
  app.put('/me/password', authorized, async (req, res, handleError) => {
    const {user, body} = req
    const {password} = body
    if (typeof password !== 'string') {
      return handleError({status: 'Bad Request'})
    }
    try {
      await user.updatePassword(password)
      return res.end()
    } catch (error) {
      return handleError({status: 'Unknown', error})
    }
  })
}
