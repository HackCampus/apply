const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const http = require('http')
const path = require('path')

const env = require('./env')
const logger = require('./logger')

const errorHandler = require('./middlewares/errors')
const limitToMatchers = require('./middlewares/limitToMatchers')
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
const models = require('./database')

// Needs to come before all other routes, as authorized middleware depends on these.
const auth = require('./routes/auth')(models)
auth.routes(app)

const application = require('./routes/application')(models)
application.routes(app)

const companies = require('./routes/companies')(models)
companies.routes(app)

const user = require('./routes/user')(models)
user.routes(app)

const match = require('./routes/match')(models)
match.routes(app)

// client-side app routes
const spa = require('./templates/spa')
const clientApp = appName => (req, res) => res.send(spa(appName))
app.get('/', clientApp('apply'))
app.get('/shortlisted', clientApp('companies'))
app.get('/match', limitToMatchers(clientApp('login')), clientApp('match'))
app.get('/match/application/:id', limitToMatchers(clientApp('login')), clientApp('matchDetail'))

// error handling & fallback route.
app.use(errorHandler)
app.use((req, res, handleError) => {
  res.status(404).end()
})

const server = http.createServer(app)

module.exports = function (port) {
  server.listen(port, () => { logger.info({port}, 'started') })
}
