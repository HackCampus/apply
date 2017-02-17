const test = require('ava')
const {spy} = require('sinon')

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

test('ApplicationEvent.create', async t => {
  const {ApplicationEvent, ApplicationSane: Application, User} = models
  const email = 'appevent@maker.test'
  const matcher = await User.create({email, role: 'matcher'})
  const applicant = await User.create({email: 'idontcare@appli.cant'})
  const application = await Application.create({userId: applicant.id})
  const type = 'commented'
  const payload = {
    comment: 'deep meaningful comment'
  }
  const event = await ApplicationEvent.create({actorId: matcher.id, applicationId: application.id, type, payload})
  const eventJson = event.toJSON()
  t.is(eventJson.actorId, matcher.id)
  t.is(eventJson.actor.email, email)
  t.is(eventJson.type, type)
  t.deepEqual(eventJson.payload, payload)
})

test('ApplicationEvent.fetchAllByApplicationId', async t => {
  const {ApplicationEvent, ApplicationSane: Application, User} = models
  const email = 'appevent@maker.test2'
  const matcher = await User.create({email, role: 'matcher'})
  const applicant = await User.create({email: 'idontcare@appli.cant2'})
  const application = await Application.create({userId: applicant.id})
  const actions = [
    {type: 'commented', payload: {comment: 'yes'}},
    {type: 'rejected'}, // no payload
    {type: 'can be anything', payload: {wrapThingsInObjectsToBeSure: 'yesss'}},
  ]
  for (let a of actions) {
    const {type, payload} = a
    await ApplicationEvent.create({actorId: matcher.id, applicationId: application.id, type, payload})
  }
  await ApplicationEvent.create({actorId: applicant.id, applicationId: application.id, type: 'applicant events too', payload: 1337})
  const events = await ApplicationEvent.fetchAllByApplicationId(application.id)
  const eventsJson = events.map(e => e.toJSON())

  // events are fetched newest -> oldest

  t.deepEqual(eventsJson[0].type, 'applicant events too')
  t.deepEqual(eventsJson[0].payload, 1337)
  t.deepEqual(eventsJson[0].actor.email, 'idontcare@appli.cant2')

  t.deepEqual(eventsJson[1].type, actions[2].type)
  t.deepEqual(eventsJson[1].payload, actions[2].payload)
  t.deepEqual(eventsJson[1].actor.email, email)

  t.deepEqual(eventsJson[2].type, actions[1].type)
  t.true(eventsJson[2].payload == null)
  t.deepEqual(eventsJson[2].actor.email, email)

  t.deepEqual(eventsJson[3].type, actions[0].type)
  t.deepEqual(eventsJson[3].payload, actions[0].payload)
  t.deepEqual(eventsJson[3].actor.email, email)
})
