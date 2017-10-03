const test = require('ava')

const makeModels = require('../database/models')
const {setupDb, teardownDb} = require('./_testDb')

let db, models
test.before('setup db', t => {
  return setupDb().then(database => {
    db = database
    models = makeModels(database)
  })
})

test.after.always('teardown db', t => {
  return teardownDb(db)
})

test('Application.create/update', async t => {
  const {ApplicationSane: Application, User} = models
  const user = await User.createWithPassword('applicationsane@test.file', 'somepass')
  const application = await Application.create({userId: user.id, firstName: 'foo', lastName: 'bar'})
  const applicationJson = application.toJSON()
  t.is(applicationJson.firstName, 'foo')
  t.is(applicationJson.lastName, 'bar')
  await application.update({lastName: 'different'})
  const applicationJson2 = application.toJSON()
  t.is(applicationJson2.firstName, 'foo')
  t.is(applicationJson2.lastName, 'different')
})

test('Application.fetchLatest', async t => {
  const {ApplicationSane: Application, User} = models
  const user = await User.createWithPassword('applicationsane2@test.file', 'somepass')
  await Application.create({userId: user.id, programmeYear: 2015})
  await Application.create({userId: user.id, firstName: 'blap', programmeYear: 2016})
  const application = await Application.fetchLatest(user.id)
  const applicationJson = application.toJSON()
  t.is(applicationJson.firstName, 'blap')
})

test.todo('Application.fetchLatest with tech preferences')
