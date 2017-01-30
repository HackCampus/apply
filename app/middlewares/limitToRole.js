module.exports = (role, unauthorizedRedirect) => {
  if (role == null) {
    throw new Error('role must not be null')
  }
  if (typeof unauthorizedRedirect !== 'function') {
    unauthorizedRedirect = function (req, res, next) {
      return next({status: 'Unauthorized'})
    }
  }
  return function (req, res, next) {
    if (req.user == null) {
      return unauthorizedRedirect(req, res, next)
    }
    const user = req.user
    const userRole = user.get('role')
    if (userRole === role) {
      return next()
    } else {
      return unauthorizedRedirect(req, res, next)
    }
  }
}
