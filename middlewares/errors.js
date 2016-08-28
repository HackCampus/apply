const status = require('statuses')

// error:
//   status: HTTP status string or number
//   message: json object sent to the client or nothing
module.exports = (error, req, res, next) => {
  res.status(status(error.status))
  if (error.message) {
    res.json(error.message)
  } else {
    res.end()
  }
}
