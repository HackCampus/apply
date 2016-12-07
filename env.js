require('localenv')

function env (varName) {
  const value = process.env[varName]
  if (value == null) console.warn(`warning: expected environment variable ${varName} to be set.`)
  return value
}

const production = process.env.NODE_ENV === 'production'

module.exports = {
  host: env('HOST'),
  saltRounds: env('BCRYPT_SALT_ROUNDS'), // bcrypt

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
    scope: [], // no scope: read-only access to public information (includes public user profile info, public repository info, and gists)
  },
  linkedin: {
    clientId: env('LINKEDIN_CLIENT_ID'),
    clientSecret: env('LINKEDIN_CLIENT_SECRET'),
    scope: ['r_basicprofile', 'r_emailaddress'],
  },
}
