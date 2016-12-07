const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const session = require('express-session')
const http = require('http')
const morgan = require('morgan')
const path = require('path')

const errorHandler = require('./middlewares/errors')

const application = require('./routes/application')
const auth = require('./routes/auth')
const user = require('./routes/user')

const env = require('./env')

const port = process.env.PORT || 3000
const app = express()

app.use(morgan('dev'))
app.use(session({
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/static', express.static(path.join(__dirname, 'build')))
app.disable('x-powered-by')

// routes
auth(app)
user(app)
application(app)

// single page app
app.get('/', require('./shell'))

app.use((req, res, handleError) => { handleError({status: 'Not Found'}) })
app.use(errorHandler)

const server = http.createServer(app)
server.listen(port, () => { console.log(port) })
