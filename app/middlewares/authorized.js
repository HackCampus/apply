module.exports = function (req, res, next) {
  return req.user
    ? next()
    : next({status: 'Unauthorized'})
}
