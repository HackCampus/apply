const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const session = require('express-session')
const fs = require('fs')
const http = require('http')
const path = require('path')
const status = require('statuses')

const errorHandler = require('./middlewares/errors')
const validateRequest = require('./middlewares/validate')

const config = require('../config')
const errors = require('./errors')
const {Authentication, Database, User} = require('./models')
const wireFormats = require('./wireFormats')

const port = process.env.PORT || 3000
const app = express()

app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/static', express.static(path.join(__dirname, 'build')))
app.disable('x-powered-by')

// passport

const passport = require('passport')

passport.serializeUser((user, done) => {
  console.log('serialize user', user)
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.where('id', id).fetch()
  .then(user => { done(null, user) })
  .catch(err => { done(err) })
})

app.use(passport.initialize())
app.use(passport.session())

// end passport

// register
// 0. junk in
// 1. user already exists
// 2. email already exists
// 3. auth is wrong?
app.post('/~', validateRequest(wireFormats.user), (req, res, handleError) => {
  const {name, email, authentication} = req.body
  Database.transaction(transaction =>
    new User({name, email})
    .save(null, {transacting: transaction})
    .tap(user => Authentication.createForUser(user, authentication, transaction))
    // TODO log in?
    .then(transaction.commit)
    .catch(transaction.rollback)
  )
  .then(user => { res.status(status('Created')).json(user.toJSON()) })
  .catch(error => {
    if (error.constraint === 'users_email_unique') {
      return handleError({status: 'Conflict', message: {error: errors.emailTaken}})
    }
    if (error.constraint === 'users_name_unique') {
      return handleError({status: 'Conflict', message: {error: errors.nameTaken}})
    }
    console.log(error)
    return handleError({status: 'Internal Server Error'})
  })
})

// login
app.post('/~:name.json', (req, res) => {

})

app.get('/~:name.json', (req, res, handleError) => {
  const {name} = req.params
  // TODO authenticated response?
  User.where('name', name).fetch()
  .then(user => {
    if (user) {
      res.json(user.toJSON())
    } else {
      // TODO error message
      return handleError({status: 'Not Found'})
    }
  })
  .catch(error => {
    console.error(error)
    return handleError({status: 'Internal Server Error'})
  })
})

// single page app
app.use(require('./shell'))

app.use(errorHandler)

const server = http.createServer(app)
server.listen(port, () => { console.log(port) })
