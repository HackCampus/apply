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

test('all public models are exposed', t => {
  t.true('Application' in models)
  t.true('Authentication' in models)
  t.true('TechPreference' in models)
  t.true('User' in models)
})

test('User constructors exist', t => {
  const {User} = models
  t.true('create' in User)
  t.true('createWithPassword' in User)
  t.true('createWithToken' in User)
  t.true('createWithAuthentication' in User)
})

test('User.create creates an applicant by default', async t => {
  const {User} = models
  const email = 'can-save-user-test@bar.baz'
  const user = await User.create({email})
  t.true(user instanceof User)
  const userJson = user.toJSON()
  t.truthy(userJson.id)
  t.truthy(userJson.createdAt)
  t.falsy(userJson.updatedAt)
  t.is(userJson.role, 'applicant')
  t.is(userJson.email, email)
})

test('User.update updates fields', async t => {
  const {User} = models
  const email = 'update1234@foo.bar'
  const email2 = 'IMUPDATED@foo.bar'
  const user = await User.create({email})
  const newUser = await user.update({email, role: 'matcher'})
  t.true(user === newUser)
  const userJson = newUser.toJSON()
  t.is(user.id, newUser.id) // id hasn't changed
  t.is(user.id, userJson.id) // id hasn't changed
  t.is(userJson.role, 'matcher')
  t.truthy(userJson.createdAt)
  t.truthy(userJson.updatedAt)
})

test('User.fetchSingle', async t => {
  const {User, errors} = models
  t.throws(User.fetchSingle({email: 'DOESNOTEXISTAARRGGGH'}), error => error instanceof errors.UserNotFound)
  const email = 'fetchmebaby@bar.baz'
  await User.create({email})
  const fetched = await User.fetchSingle({email})
  t.true(fetched instanceof User)
  const userJson = fetched.toJSON()
  t.truthy(userJson.id)
  t.truthy(userJson.createdAt)
  t.falsy(userJson.updatedAt)
  t.is(userJson.role, 'applicant')
  t.is(userJson.email, email)
})

test('User.createWithAuthentication throws with junk input', t => {
  const {User, errors} = models
  t.throws(User.createWithAuthentication('foo@bar.baz', {junk: true}), error => error instanceof errors.AuthenticationTypeError)
})

test('User.createWithAuthentication throws with a garbage authentication type', t => {
  const {User, errors} = models
  t.throws(User.createWithAuthentication('foo@bar.baz', {type: 'junk', identifier: 'foo', token: 'foo'}), error => error instanceof errors.AuthenticationNotImplemented)
})

test('User.createWithPassword, fetchById, fetchRelated', async t => {
  const {User} = models
  const createdUser = await User.createWithPassword('foo@bar.baz', 'foo')
  const user = await User.fetchById(createdUser.id)
  const userJson = user.toJSON()
  t.is(userJson.email, 'foo@bar.baz')
  const authentications = await user.fetchAuthentications()
  t.is(authentications.length, 1)
  const authentication = authentications[0]
  t.is(authentication.identifier, 'foo@bar.baz')
})

test('User.createWithToken', async t => {
  const {User} = models
  const user = await User.createWithToken('github', 'create-with-token@bar.baz', 'foobar', 'barbaz')
  const userJson = user.toJSON()
  t.is(userJson.email, 'create-with-token@bar.baz')
  const authentications = await user.fetchAuthentications()
  t.is(authentications.length, 1)
  const authentication = authentications[0]
  t.is(authentication.identifier, 'foobar')
  t.is(authentication.token, 'barbaz')
})

test('User.createWithToken on an existing user updates instead', async t => {
  const {User} = models
  await User.createWithToken('github', 'duplicate@bar.baz', 'old', 'whocares')
  const user = await User.createWithToken('github', 'duplicate@bar.baz', 'newid', 'newtoken')
  const userJson = user.toJSON()
  t.is(userJson.email, 'duplicate@bar.baz')
  const authentications = await user.fetchAuthentications()
  t.is(authentications.length, 1)
  const authentication = authentications[0]
  t.is(authentication.identifier, 'newid')
  t.is(authentication.token, 'newtoken')
})

test('User.createWithToken updates the email if a user with the same external id authenticates', async t => {
  const {errors, User} = models
  const authentication = {
    type: 'github',
    identifier: 'thesameid',
    token: 'thesamekey',
  }
  const secondEmail = 'seconduser-DIFFERENT@bar.baz'
  const firstUserModel = await User.createWithToken(authentication.type, 'firstuser@bar.baz', authentication.identifier, authentication.token)
  const firstUser = firstUserModel.toJSON()
  const secondUserModel = await User.createWithToken(authentication.type, secondEmail, authentication.identifier, authentication.token)
  const secondUser = secondUserModel.toJSON()
  const auths = await secondUserModel.fetchAuthentications()
  console.log(firstUser)
  console.log(secondUser)
  console.log(auths)
  t.true(firstUser.updatedAt !== secondUser.updatedAt)
  t.is(firstUser.id, secondUser.id)
  t.is(secondUser.email, secondEmail)
})

test('User.createWithToken throws if a user signs up with a different email but there is an email/password auth for that user', async t => {
  const {errors, User} = models
  const authentication = {
    type: 'github',
    identifier: 'asdfasdfaasdf',
    token: 'thesamekey',
  }
  const firstEmail = 'firstuser12341234@bar.baz'
  const secondEmail_DIFFERENT = 'seconduser-DIFFERENT12341234@bar.baz'
  await User.createWithPassword(firstEmail, 'somepassword')
  const user = await User.createWithToken(authentication.type, firstEmail, authentication.identifier, authentication.token)
  const firstUser = user.toJSON()
  t.throws(User.createWithToken(authentication.type, secondEmail_DIFFERENT, authentication.identifier, authentication.token), error => error instanceof errors.DuplicateKey)
})

test('User.updateAuthentication with no existing authentication', async t => {
  const {User} = models
  const authentication = {
    type: 'github',
    identifier: 'update-auth-id',
    token: 'update-auth-key',
  }
  const user = await User.createWithPassword('update-auth@foo.bar', 'foobar')
  const auth = await user.updateAuthentication(authentication)
  t.is(auth.userId, user.id)
  t.is(auth.type, authentication.type)
  t.is(auth.identifier, authentication.identifier)
  t.is(auth.token, authentication.token)
})

test('User.updateAuthentication with existing authentication', async t => {
  const {User} = models
  const authentication = {
    type: 'github',
    identifier: 'update-auth-id-someone',
    token: 'update-auth-key-something',
  }
  const newAuthentication = {
    type: 'github',
    identifier: 'update-auth-id-someone',
    token: 'update-auth-key-different',
  }
  const user = await User.createWithPassword('update-auth-existing@foo.bar', 'foobar')
  await user.updateAuthentication(authentication)
  const auth = await user.updateAuthentication(newAuthentication)
  // t.is(auth.userId, user.id)
  t.is(auth.type, newAuthentication.type)
  t.is(auth.identifier, newAuthentication.identifier)
  t.is(auth.token, newAuthentication.token)
})
