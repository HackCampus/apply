module.exports = role => {
  if (role == null) {
    throw new Error('role must not be null')
  }
  return function (req, res, next) {
    if (req.user == null) {
      return next({status: 'Unauthorized'})
    }
    const user = req.user
    const userRole = user.get('role')
    if (userRole === role) {
      return next()
    } else {
      return next({status: 'Unauthorized'})
    }
  }
}
