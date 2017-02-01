const test = require('ava')
const {spy} = require('sinon')

const makeModels = require('../database/models')
const {setupDb, teardownDb} = require('./_testDb')

let db, models, methods
test.before('setup db', t => {
  return setupDb().then(database => {
    db = database
    models = makeModels(database)
    const application = require('../routes/application')(models)
    methods = application.testing
  })
})

test.after.always('teardown db', t => {
  return teardownDb(db)
})

test('getApplication throws not found error', t => {
  const {getApplication} = methods
  const handleError = spy()
  return t.throws(getApplication(13337), error => error.status === 'Not Found')
})

test('getApplication works', t => {
  const {Application, User} = models
  const {getApplication} = methods
  const handleError = spy()
  return new User({email: 'foo@bar.baz'}).save()
    .then(user => new Application({userId: user.id, firstName: 'foozle', programmeYear: 2017}).save())
    .then(({id}) => getApplication(id, handleError))
    .then(applicationModel => {
      t.false(handleError.called)
      const application = applicationModel.toJSON()
      t.is(application.firstName, 'foozle')
    })
})

test('getApplication creates a new application for old ones', t => {
  const {Application, User} = models
  const {getApplication} = methods
  const handleError = spy()
  return new User({email: 'old-foo@bar.baz'}).save()
    .then(user => new Application({userId: user.id, firstName: 'foozle', programmeYear: 2015}).save())
    .then(({id}) => getApplication(id, handleError))
    .then(applicationModel => {
      t.false(handleError.called)
      const application = applicationModel.toJSON()
      t.is(application.programmeYear, 2017) // note!
      t.falsy(application.finishedAt)
      t.is(application.firstName, 'foozle')
    })
})

test('verifyFinished doesn\'t count optional fields', t => {
  const {verifyFinished} = methods
  const partialApplication = {dateOfBirth: '', otherUniversity: 'optional'}
  const {finished, errors} = verifyFinished(partialApplication)
  t.false(finished)
  t.deepEqual(errors, ['dateOfBirth'])
})

test('createApplicationFromPreviousYear copies an application from a previous year, and getApplication returns new application', t => {
  const {Application, User} = models
  const {getApplication, createApplicationFromPreviousYear} = methods
  const handleError = spy()
  return new User({email: 'come-again@bar.baz'}).save()
    .then(user =>
      new Application({userId: user.id, firstName: 'foozle', programmeYear: 2015}).save()
        .then(_ => createApplicationFromPreviousYear(user.id, handleError))
        .then(applicationModel => {
          t.false(handleError.called)
          const application = applicationModel.toJSON()
          t.is(application.programmeYear, 2017)
          t.is(application.firstName, 'foozle')
          return application
        }).then(() => getApplication(user.id, handleError))
        .then(applicationModel => {
          t.false(handleError.called)
          const application = applicationModel.toJSON()
          t.is(application.programmeYear, 2017)
          t.is(application.firstName, 'foozle')
        })
    )
})

test('finishApplication sets finishedAt field', t => {
  const {Application, User} = models
  const {finishApplication} = methods
  return new User({email: 'finisher@bar.baz'}).save()
    .then(user => new Application({userId: user.id, firstName: 'foozle', programmeYear: 2017}).save())
    .then(application => finishApplication(application))
    .then(applicationModel => {
      const application = applicationModel.toJSON()
      t.truthy(application.finishedAt)
    })
})
