const knex = require('knex')
const pull = require('pull-stream')
const toStream = require('pull-stream-to-stream')

const config = require('../config')

const {Database, Authentication, User, Application} = require('./models')
const oldDb = knex(config.oldDatabase)

const user = toStream.sink(pull(
  pull.asyncMap((user, done) => {
    done(null, user)
  }),
  pull.log()
))

oldDb.select().from('auth_user').pipe(user)
