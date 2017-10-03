// Uses Heroku's `x-forwarded-proto` header to redirect users to HTTPS.
module.exports = function forceHttps(req, res, next) {
  if (!req.secure && 'x-forwarded-proto' in req.headers && req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect(301, 'https://' + req.headers.host + req.url);
  } else {
    next();
  }
};