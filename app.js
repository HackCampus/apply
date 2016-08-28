// TODO move
const sessionConfig = {
  secret: 'changeme',
  resave: false,
  saveUninitialized: false,
}

const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const session = require('express-session')
const fs = require('fs')
const http = require('http')
const path = require('path')

const port = process.env.PORT || 3000
const app = express()

app.use(session(sessionConfig))
app.use(bodyParser.json())
app.use(cookieParser())

// passport

const passport = require('passport')
const {Strategy: LocalStrategy} = require('passport-local')

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  // TODO knex stuff
  done('not implemented')
})

app.use(passport.initialize())
app.use(passport.session())

// end passport

app.use('/static', express.static(path.join(__dirname, 'build')))

app.get('/~:applicant.json', (req, res) => {
  const {applicant} = req.params
  res.json({name: applicant})
})

app.use(require('./shell'))

const server = http.createServer(app)
server.listen(port, () => { console.log(port) })
