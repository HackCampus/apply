const status = require('statuses')

// error:
//   status: HTTP status string or number
//   message: json object sent to the client or nothing
module.exports = (error, req, res, next) => {
  console.error(error)
  if (error.status === 'Unknown') {
    console.error(error.error)
    return res.status(500).end()
  }
  res.status(error.status ? status(error.status) : 500)
  if (error.error) {
    return res.json(error.error)
  } else {
    return res.end()
  }
}