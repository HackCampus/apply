const Bookshelf = require('bookshelf')

const logger = require('../logger')

const Application = require('./models/Application')
const ApplicationEvent = require('./models/ApplicationEvent')
const Authentication = require('./models/Authentication')
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
    Application: bsModels.Application,
    // TODO rename once routes/application.js is rewritten
    ApplicationSane: Application(bsModels),
    ApplicationEvent: ApplicationEvent(bsModels),
    Authentication: Authentication(bsModels),
    Database: bookshelf,
    TechPreference: bsModels.TechPreference,
    User: User(bsModels),
  }
}
