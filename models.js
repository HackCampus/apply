const Bookshelf = require('bookshelf')
const Knex = require('knex')

const knexConfig = require('./knexfile')

const knex = Knex(knexConfig)
const bookshelf = Bookshelf(knex)

const User = bookshelf.Model.extend({
  tableName: 'users',
  hasTimeStamps: ['createdAt', 'updatedAt'],
  authentication: function () {
    return this.hasMany(Authentication, 'userId')
  }
})

const Authentication = bookshelf.Model.extend({
  tableName: 'authentication',
  hasTimeStamps: ['createdAt', 'updatedAt'],
  user: function () {
    return this.belongsTo('User', 'userId')
  }
})

module.exports = {
  Authentication,
  Database: bookshelf,
  User,
}
