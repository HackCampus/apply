const status = require('statuses')

const logger = require('../lib/logger')

// error:
//   status: HTTP status string or number
//   error: error code defined in errors.js
module.exports = (error, req, res, next) => {
  if (error.status === 'Unknown') {
    logger.fatal(error.error)
    res.status(500).end()
  } else {
    logger.info({error: error.message, stack: error.stack})
    try {
      const statusCode = status(error.status)
      res.status(statusCode)
    } catch (e) {
      res.status(500)
    }
    if (error.error) {
      res.json(error.error)
    } else {
      res.end()
    }
  }
  // do not call next(), otherwise the built-in error handler will be called too.
}
