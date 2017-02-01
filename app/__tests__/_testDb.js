const knex = require('knex')
const path = require('path')
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

async function setupDb () {
  try {
    await db.migrate.latest({
      directory: path.join(__dirname, '..', '..', 'migrations'),
    })
    return db
  } catch (e) {
    console.error(e)
    throw err
  }
}

function teardownDb (db) {
  return db.raw('drop owned by hackcampus;')
}
