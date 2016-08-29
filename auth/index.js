const passport = require('passport')

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

  password(passport, app)
}
