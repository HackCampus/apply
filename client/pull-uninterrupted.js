const pull = require('pull-stream')

module.exports = function uninterrupted (delay) {
  return function (read) {
    let timeout
    return function (abort, cb) {
      read(abort, function next (err, data) {
        if (err) return cb(err)
        window.clearTimeout(timeout)
        timeout = window.setTimeout(function () {
          cb(null, data)
        }, delay)
        read(abort, next)
      })
    }
  }
}
