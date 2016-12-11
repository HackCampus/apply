const knex = require('knex')
const rm = require('rimraf').sync

const testDb = './test.sqlite'

const knexConfig = {
  client: 'pg',
  connection: 'postgres://hackcampus:hackcampus@127.0.0.1:5432/test',
  useNullAsDefault: true,
}

const db = knex(knexConfig)

module.exports = {
  setupDb,
  teardownDb,
}

function setupDb () {
  return db.migrate.latest({
    directory: '../migrations',
  }).then(() => db).catch(() => db)
}

function teardownDb (db) {
  return db.raw('drop schema public cascade; create schema public; grant all on schema public to hackcampus; grant all on schema public to public;').catch(error => {})
}
