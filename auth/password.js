const bcrypt = require('bcrypt')
const {Strategy: LocalStrategy} = require('passport-local')

const errors = require('../errors')
const {User} = require('../models')

module.exports = (passport, app) => {
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
      const hashedPassword = passwordAuth.get('token')
      bcrypt.compare(password, hashedPassword, (err, passwordsMatch) => {
        if (err) return reject({status: 'Unknown', error: err})
        if (!passwordsMatch) return resolve(false)
        return resolve(user)
      })
    }))
    .then(user => done(null, user))
    .catch(err => done(err))
  }))

  app.post('/auth/password', passport.authenticate('local'), (req, res) => {
    res.end()
  })
}
