const bunyan = require('bunyan')

const production = process.env.NODE_ENV === 'production'

if (production) {
  const logger = bunyan.createLogger({
    name: 'hackcampus-apply',
    serializers: bunyan.stdSerializers,
  })

  module.exports = logger
} else {
  const logger = {
    error: console.error,
    fatal: console.error,
    info: console.log,
  }

  module.exports = logger
}
