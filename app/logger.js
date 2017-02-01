const bunyan = require('bunyan')

const logger = bunyan.createLogger({
  name: 'hackcampus-apply',
  serializers: bunyan.stdSerializers,
})

// const logger = {
//   error: console.error,
//   fatal: console.error,
//   info: console.log,
// }

module.exports = logger
