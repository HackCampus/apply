const Bookshelf = require('bookshelf')
const Knex = require('knex')

const knexConfig = require('./knexfile')

const knex = Knex(knexConfig)
const bookshelf = Bookshelf(knex)

const User = bookshelf.Model.extend({
  tableName: 'users',
})

module.exports = {
  Database: bookshelf,
  User,
}
