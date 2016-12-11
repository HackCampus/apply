const bunyan = require('bunyan')

const logger = bunyan.createLogger({
  name: 'hackcampus-apply',
  serializers: bunyan.stdSerializers,
})

module.exports = logger
