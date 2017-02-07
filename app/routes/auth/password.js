const bcrypt = require('bcrypt')
const djangoHashers = require('node-django-hashers')
const {Strategy: LocalStrategy} = require('passport-local')
const status = require('statuses')

const errors = require('../../errors')
const authorized = require('../../middlewares/authorized')
const validateRequest = require('../../middlewares/validate')
const {errors: {DuplicateEmail, UserNotFound}, User} = require('../../database')
const wireFormats = require('../../wireFormats')

const djangoHasher = djangoHashers.getHasher('pbkdf2_sha256')

function verifyPassword (requestPassword, hashedPassword) {
  return new Promise((resolve, reject) => {
    if (hashedPassword.startsWith('pbkdf2_sha256')) {
      // old users
      const passwordsMatch = djangoHasher.verify(requestPassword, hashedPassword)
      return resolve(passwordsMatch)
    } else {
      // new users
      bcrypt.compare(requestPassword, hashedPassword, (err, passwordsMatch) => {
        if (err) return reject(err)
        return resolve(passwordsMatch)
      })
    }
  })
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
      const user = await User.fetchSingle({email})
      const authentications = await user.fetchAuthentications()
      const passwordAuths = authentications.filter(a => a.type === 'password')
      if (passwordAuths.length < 1) {
        return nextError({status: 'Unauthorized', error: errors.noPassword})
      }
      const {token} = passwordAuths[0]
      try {
        const passwordsMatch = await verifyPassword(password, token)
        if (passwordsMatch) {
          return nextSuccess(user)
        } else {
          return nextError({status: 'Unauthorized', error: errors.loginIncorrect})
        }
      } catch (error) {
        return nextError({status: 'Unknown', error: error.message})
      }

    } catch (error) {
      if (error instanceof UserNotFound) {
        return nextError({status: 'Unauthorized', error: errors.loginIncorrect})
      }
      return nextError({status: 'Unknown', error: error.message})
    }
  }))

  app.post('/auth/password', passport.authenticate('local'), (req, res) => {
    res.end()
  })

  // Change password
  app.put('/me/password', authorized, (req, res, handleError) => {
    const {user, body} = req
    const {password} = body
    if (typeof password !== 'string') {
      return handleError({status: 'Bad Request'})
    }
    const email = user.get('email')
    req.user.updatePassword(password)
      .then(() => {
        res.end()
      })
      .catch(error => {
        return handleError({status: 'Unknown', error})
      })
  })
}
