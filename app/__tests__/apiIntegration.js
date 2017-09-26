const test = require('ava')
const axios = require('axios')
const sinon = require('sinon')
const extend = require('xtend')

// server

process.env.NODE_ENV = 'production'
const {port, server} = require('./_serve')()
test.after.always(() => {
  server.close()
})

// API

const api = axios.create({
  baseURL: `http://127.0.0.1:${port}`,
})
const register = data => api.post('/users', data)
const login = data => api.post('/auth/password', data)
const changePassword = (data, cookie) => api.put('/me/password', data, cookie ? {headers: {cookie}} : {})
const getApplication = cookie => api.get('/me/application', cookie ? {headers: {cookie}} : {})
const putApplication = (data, cookie) => api.put('/me/application', data, cookie ? {headers: {cookie}} : {})
const getTechPreferences = cookie => api.get('/me/application/techpreferences', cookie ? {headers: {cookie}} : {})
const putTechPreferences = (data, cookie) => api.put('/me/application/techpreferences', data, cookie ? {headers: {cookie}} : {})

const testCredentials = {email: 'foo@bar.baz', password: 'helloworld'}

async function getCookie (credentialOverrides) {
  const credentials = extend(testCredentials, credentialOverrides)
  const response = await api.post('/auth/password', credentials)
  return response.headers['set-cookie'][0]
}

// tests

// === register ===

test('register - weird stuff gets bad request response', async t => {
  const error = await t.throws(register({weird: 'stuff'}))
  t.is(error.response.status, 400)
})

test('register - weird types gets bad request response', async t => {
  const error = await t.throws(register({name: 1337, email: 'not an email'}))
  t.is(error.response.status, 400)
})

test('register - already taken', async t => {
  const error = await t.throws(register(testCredentials))
  t.is(error.response.status, 409)
})

// === login ===


test('login - wrong login gives you unauthorized response', async t => {
  const error = await t.throws(login({email: 'foo@bar.baz', password: 'wrooooooong'}))
  t.is(error.response.status, 401)
})

test('login/register - happy case', async t => {
  const random = (Math.random() + '').slice(2, 10)
  const newUser = {email: `foo${random}@example.com`, password: 'foobar'}
  const registerResponse = await register(newUser)
  t.is(registerResponse.status, 201)

  const loginResponse = await login(newUser)
  t.is(loginResponse.status, 200)
  t.truthy(loginResponse.headers['set-cookie'])
  const cookie = loginResponse.headers['set-cookie'][0]
  t.truthy(cookie)

  const profileResponse = await api.get('/me', {headers: {cookie}})
  t.is(profileResponse.status, 200)
  const body = profileResponse.data
  t.is(body.email, newUser.email)
  t.is(body.role, 'applicant')
  t.true(typeof body.connectedAccounts === 'object')
  t.true(body.connectedAccounts.password)
})

// === change password ===


test('change password - unauthorized', async t => {
  const error = await t.throws(changePassword({password: 'newpasswordpls'}))
  t.is(error.response.status, 401)
})

test('change password - can log in only with new password', async t => {
  const random = (Math.random() + '').slice(2, 10)
  const email = `foo${random}@example.com`
  const oldPassword = 'oldpassword'
  const newPassword = 'newpassword'
  const credentials = {email, password: oldPassword}
  await register(credentials)

  const cookie = await getCookie(credentials)
  const junk = await t.throws(changePassword({junk: 'something something'}, cookie))
  t.is(junk.response.status, 400)
  const changed = await changePassword({password: newPassword}, cookie)
  t.is(changed.status, 200)

  const oldLogin = await t.throws(login({email, password: oldPassword}))
  t.is(oldLogin.response.status, 401)

  const newLogin = await login({email, password: newPassword})
  t.is(newLogin.status, 200)
  t.truthy(newLogin.headers['set-cookie'])
  t.truthy(newLogin.headers['set-cookie'][0])
})

// === application ===

test('application - unauthorized', async t => {
  const error = await t.throws(getApplication())
  t.is(error.response.status, 401)
})

test('application - new', async t => {
  const random = (Math.random() + '').slice(2, 10)
  const credentials = {email: `foo${random}@example.com`, password: 'foobar'}

  await register(credentials)
  const cookie = await getCookie(credentials)

  const newApplication = await t.throws(getApplication(cookie))
  t.is(newApplication.response.status, 404)

  const put = await putApplication({}, cookie)
  t.is(put.status, 200)
})

test('application - put empty', async t => {
  const cookie = await getCookie()
  const response = await putApplication({}, cookie)
  t.is(response.status, 200)
})

test('application - put good', async t => {
  const cookie = await getCookie()
  const put = await putApplication({firstName: 'TestUser'}, cookie)
  t.is(put.status, 200)
  const get = await getApplication(cookie)
  t.is(get.data.firstName, 'TestUser')
})

// === tech preferences ===

test('techpreferences - unauthorized put', async t => {
  const error = await t.throws(putTechPreferences())
  t.is(error.response.status, 401)
})

test('techpreferences - good', async t => {
  const cookie = await getCookie()
  const put = await putTechPreferences({React: 3}, cookie)
  t.is(put.status, 200)
  t.is(put.data.React, 3)
})

test('techpreferences - bad value', async t => {
  const cookie = await getCookie()
  const error = await t.throws(putTechPreferences({React: 4}, cookie))
  t.is(error.response.status, 400)
})

test('techpreferences - junk', async t => {
  const cookie = await getCookie()
  const error = await t.throws(putTechPreferences({Junk: 0}, cookie))
  t.is(error.response.status, 400)
})
