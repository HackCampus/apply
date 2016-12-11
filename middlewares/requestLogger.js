const bunyanMiddleware = require('bunyan-middleware')

module.exports = function (logger) {
  return bunyanMiddleware({
    logger,
    obscureHeaders: ['cookie'],
  })
}
