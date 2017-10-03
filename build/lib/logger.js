const bunyan = require('bunyan');

const production = process.env.NODE_ENV === 'production';

if (production) {
  const logger = bunyan.createLogger({
    name: 'hackcampus-apply',
    serializers: bunyan.stdSerializers
  });

  module.exports = logger;
} else {
  const PrettyStream = require('bunyan-prettystream');
  const prettyStdout = new PrettyStream();
  prettyStdout.pipe(process.stdout);

  const logger = bunyan.createLogger({
    name: 'hackcampus-apply',
    serializers: bunyan.stdSerializers,
    streams: [{
      level: 'info',
      type: 'raw',
      stream: prettyStdout
    }]
  });

  module.exports = logger;
}