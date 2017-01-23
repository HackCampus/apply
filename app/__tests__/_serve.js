const app = require('../app')

module.exports = function () {
  const port = Math.floor(Math.random() * 20000) + 1024
  app(port)
  return port
}
