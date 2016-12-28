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

test('can save user with test db', t => {
  const {User} = models
  const user = new User({email: 'can-save-user-test@bar.baz'})
  return user.save()
})

test('User.createWithAuthentication exists', t => {
  const {User} = models
  t.true('createWithAuthentication' in User)
})

test('User.createWithAuthentication throws with junk input', t => {
  const {User, errors} = models
  t.throws(User.createWithAuthentication('foo@bar.baz', {junk: true}), error => error instanceof errors.AuthenticationTypeError)
})

test('User.createWithAuthentication throws with a garbage authentication type', t => {
  const {User, errors} = models
  t.throws(User.createWithAuthentication('foo@bar.baz', {type: 'junk', identifier: 'foo', token: 'foo'}), error => error instanceof errors.AuthenticationNotImplemented)
})

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

test('User.createWithToken returns a user', t => {
  const {User} = models
  return User.createWithToken('github', 'create-with-token@bar.baz', 'foobar', 'barbaz').then(user => {
    const userJson = user.toJSON()
    t.is(userJson.email, 'create-with-token@bar.baz')
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
  })
})

test('User.createWithToken updates the email if a user with the same external id authenticates', t => {
  const {errors, User} = models
  const authentication = {
    type: 'github',
    identifier: 'thesameid',
    token: 'thesamekey',
  }
  const secondEmail = 'seconduser-DIFFERENT@bar.baz'
  let firstUser = {}
  return User.createWithToken(authentication.type, 'firstuser@bar.baz', authentication.identifier, authentication.token).then(user => {
    firstUser = user.toJSON()
    return User.createWithToken(authentication.type, secondEmail, authentication.identifier, authentication.token)
  }).then(userModel => {
    const secondUser = userModel.toJSON()
    t.true(firstUser.updatedAt !== secondUser.updatedAt)
    t.is(firstUser.id, secondUser.id)
    t.is(secondUser.email, secondEmail)
  })
})

test('User.createWithToken throws if a user signs up with a different email but there is an email/password auth for that user', t => {
  const {errors, User} = models
  const authentication = {
    type: 'github',
    identifier: 'asdfasdfaasdf',
    token: 'thesamekey',
  }
  const firstEmail = 'firstuser12341234@bar.baz'
  const secondEmail_DIFFERENT = 'seconduser-DIFFERENT12341234@bar.baz'
  let firstUser = {}
  return User.createWithPassword(firstEmail, 'somepassword').then(user => {
    return User.createWithToken(authentication.type, firstEmail, authentication.identifier, authentication.token)
  })
  .then(user => {
    firstUser = user.toJSON()
    t.throws(User.createWithToken(authentication.type, secondEmail_DIFFERENT, authentication.identifier, authentication.token), error => error instanceof errors.CanNotChangeEmailWithPassword)
  })
})

test('User.updateAuthentication with no existing authentication', t => {
  const {User} = models
  const authentication = {
    type: 'github',
    identifier: 'update-auth-id',
    token: 'update-auth-key',
  }
  return User.createWithPassword('update-auth@foo.bar', 'foobar').then(user => {
    return user.updateAuthentication(authentication)
      .then(newAuth => {
        const auth = newAuth.toJSON()
        t.is(auth.userId, user.id)
        t.is(auth.type, authentication.type)
        t.is(auth.identifier, authentication.identifier)
        t.is(auth.token, authentication.token)
      })
  })
})

test('User.updateAuthentication with existing authentication', t => {
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
  return User.createWithPassword('update-auth-existing@foo.bar', 'foobar').then(user => {
    return user.updateAuthentication(authentication)
      .then(() => user.updateAuthentication(newAuthentication))
      .then(newAuth => {
        const auth = newAuth.toJSON()
        t.is(auth.userId, user.id)
        t.is(auth.type, newAuthentication.type)
        t.is(auth.identifier, newAuthentication.identifier)
        t.is(auth.token, newAuthentication.token)
      })
  })
})
