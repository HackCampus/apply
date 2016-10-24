const passport = require('passport')

const {User} = require('../../models')

const github = require('./github')
const linkedin = require('./linkedin')
const password = require('./password')

module.exports = app => {
  app.use(passport.initialize())
  app.use(passport.session())

  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser((id, done) => {
    User.where('id', id).fetch()
      .then(user => { done(null, user) })
      .catch(err => { done(err) })
  })

  app.get('/auth/error', (req, res) => {
    res.send('Authentication failed. If you tried to connect an account, check that you haven\'t already started another application with that account.')
  })

  github(passport, app)
  linkedin(passport, app)
  password(passport, app)
}
