const id = x => x

// through
module.exports = function either (onSuccess = id, onFailure = id) {
  return function (read) {
    return function (abort, next) {
      read(abort, function (end, data) {
        debugger
        if (end === true) {
          next(true)
        } else if (end) {
          next(null, onFailure(end))
          next(true)
        } else {
          next(null, onSuccess(data))
        }
      })
    }
  }
}
