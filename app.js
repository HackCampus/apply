const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const session = require('express-session')
const http = require('http')
const morgan = require('morgan')
const path = require('path')

const errorHandler = require('./middlewares/errors')

const user = require('./routes/user')
const auth = require('./routes/auth')

const config = require('../config')

const port = process.env.PORT || 3000
const app = express()

app.use(morgan('dev'))
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/static', express.static(path.join(__dirname, 'build')))
app.disable('x-powered-by')

auth(app)
user(app)

// single page app
app.use(require('./shell'))

app.use(errorHandler)

const server = http.createServer(app)
server.listen(port, () => { console.log(port) })
