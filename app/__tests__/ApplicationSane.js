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

test('create/update', async t => {
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
