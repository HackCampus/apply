const test = require('ava')
const knex = require('knex')
const rm = require('rimraf').sync
const sinon = require('sinon')

const makeModels = require('../database/models')

const testDb = './test.sqlite'

const knexConfig = {
  client: 'pg',
  connection: 'postgres://hackcampus:hackcampus@127.0.0.1:5432/test',
  useNullAsDefault: true,
}

let models
let db
test.before('create db', t => {
  db = knex(knexConfig)
  return db.migrate.latest({
    directory: '../migrations',
  }).then(() => {
    models = makeModels(db)
  })
})

test('all public models are exposed', t => {
  t.true('Application' in models)
  t.true('Authentication' in models)
  t.true('TechPreference' in models)
  t.true('User' in models)
})

test('can save user with test db', t => {
  const {User} = models
  const user = new User({email: 'can-save-user-test@bar.baz'})
  return user.save()
})

test('User.createWithAuthentication exists', sinon.test(function (t) {
  const {User} = models
  t.true('createWithAuthentication' in User)
}))

test('User.createWithAuthentication throws with junk input', sinon.test(function (t) {
  const {User} = models
  t.throws(User.createWithAuthentication('foo@bar.baz', {junk: true}))
}))

test('User.createWithAuthentication throws with a garbage authentication type', sinon.test(function (t) {
  const {User} = models
  t.throws(User.createWithAuthentication('foo@bar.baz', {type: 'junk', identifier: 'foo', token: 'foo'}))
}))

test('User.createWithPassword & fetch', t => {
  const {User} = models
  return User.createWithPassword('foo@bar.baz', 'foo').then(user => {
    return new User({id: user.id}).fetch({withRelated: 'authentication'})
  }).then(user => {
    const userJson = user.toJSON()
    t.is(userJson.email, 'foo@bar.baz')
    const authentications = user.related('authentication').toJSON()
    t.is(authentications.length, 1)
    const authentication = authentications[0]
    t.is(authentication.identifier, 'foo@bar.baz')
  })
})

test('User.createWithToken', t => {
  const {User} = models
  return User.createWithToken('github', 'create-with-token@bar.baz', 'foobar', 'barbaz').then(user => {
    return new User({id: user.id}).fetch({withRelated: 'authentication'})
  }).then(user => {
    const userJson = user.toJSON()
    t.is(userJson.email, 'create-with-token@bar.baz')
    const authentications = user.related('authentication').toJSON()
    t.is(authentications.length, 1)
    const authentication = authentications[0]
    t.is(authentication.identifier, 'foobar')
    t.is(authentication.token, 'barbaz')
  })
})

test('User.createWithToken on an existing user updates instead', t => {
  const {User} = models
  return User.createWithToken('github', 'duplicate@bar.baz', 'old', 'whocares').then(_ => {
    return User.createWithToken('github', 'duplicate@bar.baz', 'newid', 'newtoken')
  }).then(user => {
    const userJson = user.toJSON()
    t.is(userJson.email, 'duplicate@bar.baz')
    const authentications = user.related('authentication').toJSON()
    t.is(authentications.length, 1)
    const authentication = authentications[0]
    t.is(authentication.identifier, 'newid')
    t.is(authentication.token, 'newtoken')
  })
})

test('User.createWithToken throws with same keys for different users', t => {
  const {errors, User} = models
  const authentication = {
    type: 'github',
    identifier: 'thesameid',
    token: 'thesamekey',
  }
  return User.createWithToken(authentication.type, 'firstuser@bar.baz', authentication.identifier, authentication.token).then(_ => {
    t.throws(User.createWithToken(authentication.type, 'seconduser-DIFFERENT@bar.baz', authentication.identifier, authentication.token), error => error instanceof errors.DuplicateKey)
  })
})

test.after.always('delete test db', t => {
  return db.raw('drop schema public cascade; create schema public; grant all on schema public to hackcampus; grant all on schema public to public;')
})
