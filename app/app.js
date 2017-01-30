const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const http = require('http')
const path = require('path')

const env = require('./env')
const logger = require('./logger')
const roles = require('./roles')

const models = require('./database')
const application = require('./routes/application')(models)
const auth = require('./routes/auth')(models)
const user = require('./routes/user')(models)

const errorHandler = require('./middlewares/errors')
const limitToRole = require('./middlewares/limitToRole')
const requestLogger = require('./middlewares/requestLogger')
const session = require('./middlewares/session')

const app = express()

// app.use(requestLogger(logger))
app.use(session())
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/static', express.static(path.join(__dirname, 'build')))
app.disable('x-powered-by')

// routes
auth.routes(app)
user.routes(app)
application.routes(app)

// client-side app routes
const shell = require('./shell')
const clientApp = appName => (req, res) => res.send(shell(appName))
app.get('/', clientApp('apply'))
app.get('/vet', limitToRole(roles.matcher), clientApp('vet'), (error, req, res, next) => {
  if (error.status && error.status === 'Unauthorized') {
    return clientApp('login')(req, res)
  } else {
    return next(error)
  }
})
app.get('/vet', clientApp('login')) // unauthorized users

// error handling & fallback route.
app.use(errorHandler)
app.use((req, res, handleError) => {
  res.status(404).end()
})

const server = http.createServer(app)

module.exports = function (port) {
  server.listen(port, () => { logger.info({port}, 'started') })
}
