module.exports = function setReturnTo (req, res, next) {
  req.session.returnTo = req.headers.referer
  next()
}
