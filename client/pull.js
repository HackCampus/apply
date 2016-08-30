// through
const either = (onSuccess, onFailure) =>
  read =>
    (abort, next) =>
      read(abort, (end, data) => {
        if (end === true) return next(true)
        if (end) {
          next(null, onFailure(end))
          return next(true)
        }
        return next(null, onSuccess(data))
      })

module.exports = {
  either,
}
