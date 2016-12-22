const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const http = require('http')
const path = require('path')

const models = require('./database')
const logger = require('./logger')

const errorHandler = require('./middlewares/errors')
const requestLogger = require('./middlewares/requestLogger')
const session = require('./middlewares/session')

const application = require('./routes/application')(models)
const auth = require('./routes/auth')(models)
const user = require('./routes/user')(models)

const env = require('./env')

const port = process.env.PORT || 3000
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

// single page app
app.get('/', require('./shell'))

// error handling & fallback route.
app.use(errorHandler)
app.use((req, res, handleError) => {
  res.status(404).end()
})

const server = http.createServer(app)
server.listen(port, () => { logger.info({port}, 'started') })
