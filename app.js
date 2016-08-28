const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const session = require('express-session')
const fs = require('fs')
const http = require('http')
const path = require('path')

const config = require('../config')
const {User} = require('./models')

const port = process.env.PORT || 3000
const app = express()

app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
}))
app.use(bodyParser.json())
app.use(cookieParser())

// passport

const passport = require('passport')
const {Strategy: LocalStrategy} = require('passport-local')

passport.serializeUser((user, done) => {
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

app.use('/static', express.static(path.join(__dirname, 'build')))

app.get('/~:name.json', (req, res) => {
  const {name} = req.params
  // TODO authenticated response?
  User.where('name', name).fetch()
  .then(user => res.json(user.toJSON()))
  .catch(err => {
    console.log(err)
    res.status(404).send('TODO')
  })
})

app.use(require('./shell'))

const server = http.createServer(app)
server.listen(port, () => { console.log(port) })
