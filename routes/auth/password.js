const bcrypt = require('bcrypt')
const djangoHashers = require('node-django-hashers')
const {Strategy: LocalStrategy} = require('passport-local')
const status = require('statuses')

const errors = require('../../errors')
const validateRequest = require('../../middlewares/validate')
const {User} = require('../../models')
const wireFormats = require('../../wireFormats')

const djangoHasher = djangoHashers.getHasher('pbkdf2_sha256')

module.exports = (passport, app) => {
  // Registration
  // errors:
  // 0. junk in
  // 1. email already exists
  app.post('/users', validateRequest(wireFormats.register) /*0*/, (req, res, handleError) => {
    const {email, password} = req.body
    User.createWithPassword(email, password)
    .then(user => { res.status(status('Created')).json(user.toJSON()) })
    .catch(error => {
      if (error.constraint === 'users_email_unique') { /*1*/
        return handleError({status: 'Conflict', error: errors.emailTaken})
      }
      return handleError({status: 'Unknown', error})
    })
  })

  // Log-in
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  }, function (email, password, done) {
    User.where('email', email)
    .fetch({withRelated: ['authentication']})
    .then(user => new Promise((resolve, reject) => {
      const auth = user.related('authentication')
      const passwordAuth = auth.findWhere({type: 'password'})
      if (!passwordAuth) {
        return reject({status: 'Unauthorized', error: errors.noPassword})
      }

      const done = (err, passwordsMatch) => {
        if (err) return reject({status: 'Unknown', error: err})
        if (!passwordsMatch) return resolve(false)
        return resolve(user)
      }

      const hashedPassword = passwordAuth.get('token')
      if (hashedPassword.startsWith('pbkdf2_sha256')) {
        // old users
        const passwordsMatch = djangoHasher.verify(password, hashedPassword)
        done(null, passwordsMatch)
      } else {
        // new users
        bcrypt.compare(password, hashedPassword, done)
      }
    }))
    .then(user => done(null, user))
    .catch(err => done(err))
  }))

  app.post('/auth/password', passport.authenticate('local'), (req, res) => {
    res.end()
  })
}
