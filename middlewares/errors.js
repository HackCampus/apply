const status = require('statuses')

const logger = require('../logger')

// error:
//   status: HTTP status string or number
//   message: json object sent to the client or nothing
module.exports = (error, req, res, next) => {
  if (error.status === 'Unknown') {
    logger.fatal(error.error)
    res.status(500).end()
  } else {
    logger.info({error})
    res.status(error.status ? status(error.status) : 500)
    if (error.error) {
      res.json(error.error) // just an error code, defined in errors.js
    } else {
      res.end() // nothing
    }
  }
  return next()
}
