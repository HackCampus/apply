const env = require('../../env');

module.exports = function setReturnTo(req, res, next) {
  if (req.session) {
    req.session.returnTo = req.headers.referer;
  } else {
    return res.redirect(env.host);
  }
  next();
};