const Bookshelf = require('bookshelf')

const logger = require('../logger')

const Application = require('./models/Application')
const TechPreference = require('./models/TechPreference')
const User = require('./models/User')

const bookshelfModels = require('./_bookshelfModels')
const errors = require('./errors')
const hashPassword = require('./hashPassword')

module.exports = function (knexInstance) {
  const bookshelf = Bookshelf(knexInstance)
  const bsModels = bookshelfModels(bookshelf)

  return {
    errors,
    Authentication: bsModels.Authentication,
    Database: bookshelf,
    User: User(bsModels),
    TechPreference: bsModels.TechPreference,
    Application: bsModels.Application,
    ApplicationSane: Application(bsModels),
  }
}
