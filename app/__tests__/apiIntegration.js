const test = require('ava')
const sinon = require('sinon')
const extend = require('xtend')

process.env.NODE_ENV = 'production'
const {port, server} = require('./_serve')()
test.after.always(() => {
  server.close()
})

const api = require('./_apiClient')(`http://127.0.0.1:${port}`)

const testCredentials = {email: 'foo@bar.baz', password: 'helloworld'}

async function getCookie (credentialOverrides) {
  const credentials = extend(testCredentials, credentialOverrides)
  const response = await api.login(credentials)
  return response.headers['set-cookie'][0]
}

// === register ===

test('register - weird stuff gets bad request response', async t => {
  const error = await t.throws(api.register({weird: 'stuff'}))
  t.is(error.response.status, 400)
})

test('register - weird types gets bad request response', async t => {
  const error = await t.throws(api.register({name: 1337, email: 'not an email'}))
  t.is(error.response.status, 400)
})

test('register - already taken', async t => {
  const error = await t.throws(api.register(testCredentials))
  t.is(error.response.status, 409)
})

// === login ===


test('login - wrong login gives you unauthorized response', async t => {
  const error = await t.throws(api.login({email: 'foo@bar.baz', password: 'wrooooooong'}))
  t.is(error.response.status, 401)
})

test('login/register - happy case', async t => {
  const random = (Math.random() + '').slice(2, 10)
  const newUser = {email: `foo${random}@example.com`, password: 'foobar'}
  const registerResponse = await api.register(newUser)
  t.is(registerResponse.status, 201)

  const loginResponse = await api.login(newUser)
  t.is(loginResponse.status, 200)
  t.truthy(loginResponse.headers['set-cookie'])
  const cookie = loginResponse.headers['set-cookie'][0]
  t.truthy(cookie)

  const profileResponse = await api.profile(cookie)
  t.is(profileResponse.status, 200)
  const body = profileResponse.data
  t.is(body.email, newUser.email)
  t.is(body.role, 'applicant')
  t.true(typeof body.connectedAccounts === 'object')
  t.true(body.connectedAccounts.password)
})

// === change password ===


test('change password - unauthorized', async t => {
  const error = await t.throws(api.changePassword({password: 'newpasswordpls'}))
  t.is(error.response.status, 401)
})

test('change password - can log in only with new password', async t => {
  const random = (Math.random() + '').slice(2, 10)
  const email = `foo${random}@example.com`
  const oldPassword = 'oldpassword'
  const newPassword = 'newpassword'
  const credentials = {email, password: oldPassword}
  await api.register(credentials)

  const cookie = await getCookie(credentials)
  const junk = await t.throws(api.changePassword({junk: 'something something'}, cookie))
  t.is(junk.response.status, 400)
  const changed = await api.changePassword({password: newPassword}, cookie)
  t.is(changed.status, 200)

  const oldLogin = await t.throws(api.login({email, password: oldPassword}))
  t.is(oldLogin.response.status, 401)

  const newLogin = await api.login({email, password: newPassword})
  t.is(newLogin.status, 200)
  t.truthy(newLogin.headers['set-cookie'])
  t.truthy(newLogin.headers['set-cookie'][0])
})

// === application ===

test('application - unauthorized', async t => {
  const error = await t.throws(api.getApplication())
  t.is(error.response.status, 401)
})

test('application - new', async t => {
  const random = (Math.random() + '').slice(2, 10)
  const credentials = {email: `foo${random}@example.com`, password: 'foobar'}

  await api.register(credentials)
  const cookie = await getCookie(credentials)

  const newApplication = await t.throws(api.getApplication(cookie))
  t.is(newApplication.response.status, 404)

  const put = await api.putApplication({}, cookie)
  t.is(put.status, 200)
})

test('application - put empty', async t => {
  const cookie = await getCookie()
  const response = await api.putApplication({}, cookie)
  t.is(response.status, 200)
})

test('application - put good', async t => {
  const cookie = await getCookie()
  const put = await api.putApplication({firstName: 'TestUser'}, cookie)
  t.is(put.status, 200)
  const get = await api.getApplication(cookie)
  t.is(get.data.firstName, 'TestUser')
})

// === tech preferences ===

test('techpreferences - unauthorized put', async t => {
  const error = await t.throws(api.putTechPreferences())
  t.is(error.response.status, 401)
})

test('techpreferences - good', async t => {
  const cookie = await getCookie()
  const put = await api.putTechPreferences({React: 3}, cookie)
  t.is(put.status, 200)
  t.is(put.data.React, 3)
  const get = await api.getApplication(cookie)
  t.is(get.status, 200)
  t.is(get.data.techPreferences.React, 3)
})

test('techpreferences - bad value', async t => {
  const cookie = await getCookie()
  const error = await t.throws(api.putTechPreferences({React: 4}, cookie))
  t.is(error.response.status, 400)
})

test('techpreferences - junk', async t => {
  const cookie = await getCookie()
  const error = await t.throws(api.putTechPreferences({Junk: 0}, cookie))
  t.is(error.response.status, 400)
})
