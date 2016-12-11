const localenv = require('localenv/noload')
localenv.inject_env(__dirname + '/.env')

const {env, envNumber} = require('./envHelpers')

const production = process.env.NODE_ENV === 'production'

module.exports = {
  host: env('HOST'),
  saltRounds: envNumber('BCRYPT_SALT_ROUNDS'),

  // sessions
  sessionSecret: env('SESSION_SECRET'), // express-session
  redisUrl: production ? env('REDIS_URL') : null, // store sessions in memory during development

  // Knex env
  database: {
    client: env('DATABASE_CLIENT'),
    connection: env('DATABASE_URL'),
    migrations: {
      tableName: env('MIGRATIONS_TABLENAME'),
    },
  },
  oldDatabase: {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      user: 'harry',
      password: '',
      database: 'old',
      charset: 'utf8',
    },
  },

  // OAuth
  github: {
    clientId: env('GITHUB_CLIENT_ID'),
    clientSecret: env('GITHUB_CLIENT_SECRET'),
    scope: ['user:email'],
  },
  linkedin: {
    clientId: env('LINKEDIN_CLIENT_ID'),
    clientSecret: env('LINKEDIN_CLIENT_SECRET'),
    scope: ['r_basicprofile', 'r_emailaddress'],
  },
}
