const passport = require('passport')

const github = require('./github')
const linkedin = require('./linkedin')
const password = require('./password')

module.exports = models => {
  const {User} = models

  function routes (app) {
    app.use(passport.initialize())
    app.use(passport.session())

    passport.serializeUser((user, done) => {
      done(null, user.id)
    })

    passport.deserializeUser((id, done) => {
      User.where('id', id).fetch()
        .then(user => { done(null, new User(user)) }) // TODO de-bs
        .catch(err => { done(err) })
    })

    app.get('/auth/error', (req, res) => {
      res.send('Authentication failed. If you tried to connect an account, check that you haven\'t already started another application with that account.')
    })

    github(passport, app)
    linkedin(passport, app)
    password(passport, app)
  }

  return {
    routes,
  }
}
