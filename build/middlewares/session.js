const session = require('express-session');

const env = require('../env');

function redisStore(url) {
  const RedisStore = require('connect-redis')(session);
  const store = new RedisStore({ url });
  return session({
    store,
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false
  });
}

function memoryStore() {
  return session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false
  });
}

module.exports = function () {
  const redisUrl = env.redisUrl;
  return redisUrl == null ? memoryStore() : redisStore(redisUrl);
};