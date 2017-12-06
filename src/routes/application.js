// @flow
import type {$Response, Middleware, Router} from 'express'
import type {Request} from '../types'

const isEmpty = require('lodash.isempty')
const extend = require('xtend')

const errors = require('../database/errors')

const logger = require('../lib/logger')

const authorized = require('../middlewares/authorized')
const validate = require('../middlewares/validate')

const constants = require('../constants')
const wireFormats = require('../wireFormats')

module.exports = function (models) {
  const {Database, Application, TechPreference} = models

  function routes (app: Router) {
    app.get('/me/application',
      authorized,
      handleGetApplication)

    app.put('/me/application',
      authorized,
      validate(wireFormats.application),
      handlePutApplication)

    app.put('/me/application/techpreferences',
      authorized,
      validate(wireFormats.techPreferences),
      handlePutTechPreferences)
  }

  // Application - handlers

  async function handleGetApplication (req: Request, res: $Response) {
    if (!req.user) {
      throw {status: 'Unauthorized'}
    }
    const userId = req.user.id
    const application = await Application.fetchLatest(userId)
    if (!application) {
      throw {status: 'Not Found'}
    }
    res.json(await application.materialize())
  }

  async function handlePutApplication (req: Request, res: $Response) {
    if (!req.user) {
      throw {status: 'Unauthorized'}
    }
    const userId = req.user.id
    const updates = req.body
    if (updates.finished) {
      logger.info({userId}, 'finishing application')
      delete updates.finished
      updates.finishedAt = new Date()
    } else {
      logger.info({userId}, 'updating application')
    }
    try {
      const application = await Application.updateOrRenew(userId, updates)
      res.json(await application.materialize())
    } catch (e) {
      if (e instanceof errors.ApplicationFinished) {
        throw {status: 'Unauthorized'}
      } else {
        throw e
      }
    }
  }

  async function handlePutTechPreferences (req: Request, res: $Response) {
    const userId = req.user.id
    try {
      const application = await Application.updateOrRenew(userId, {techPreferences: req.body})
      res.json(await application.fetchTechPreferences())
    } catch (e) {
      if (e instanceof errors.ApplicationFinished) {
        throw {status: 'Unauthorized'}
      } else {
        throw e
      }
    }
  }

  return {
    routes,
  }
}
