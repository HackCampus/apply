const test = require('ava')
const axios = require('axios')
const hippie = require('hippie')
const sinon = require('sinon')
const extend = require('xtend')
hippie.assert.showDiff = true

process.env.NODE_ENV = 'production'
const port = require('./_serve')()

const host = `http://127.0.0.1:${port}`

const api = () =>
  hippie()
  .json()
  .base(host)

const testCredentials = {email: 'foo@bar.baz', password: 'helloworld'}

const getCookie = credentialOverrides =>
  axios
    .post(`${host}/auth/password`, extend(testCredentials, credentialOverrides))
    .then(res => res.headers['set-cookie'][0])

// === register ===

const register = () =>
  api()
  .post('/users')

test.cb('register - weird stuff gets bad request response', t => {
  register()
  .send({weird: 'stuff'})
  .expectStatus(400)
  .end(t.end)
})

test.cb('register - weird types gets bad request response', t => {
  register()
  .send({name: 1337, email: 'not an email'})
  .expectStatus(400)
  .end(t.end)
})

test.cb('register - already taken', t => {
  register()
  .send(testCredentials)
  .expectStatus(409)
  .end(t.end)
})

// === login ===

const login = () =>
  api()
  .post('/auth/password')

test.cb('login - wrong login gives you unauthorized response', t => {
  login()
  .send({email: 'foo@bar.baz', password: 'wrooooooong'})
  .expectStatus(401)
  .end(t.end)
})

test('login/register - happy case', t => {
  const random = (Math.random() + '').slice(2, 10)
  const deets = {email: `foo${random}@example.com`, password: 'foobar'}
  return register()
  .send(deets)
  .expectStatus(201)
  .end()
  .then(() =>
    login()
    .send(deets)
    .expectStatus(200)
    .expectHeader('set-cookie', /.*/)
    .end()
  )
})

// === change password ===

const changePassword = cookie =>
  api()
  .header('cookie', cookie)
  .post('/me/password')

test('change password - unauthorized', t => {
  return changePassword('')
  .send({password: 'newpasswordpls'})
  .expectStatus(401)
  .end()
})

test('change password - can log in only with new password', t => {
  const random = (Math.random() + '').slice(2, 10)
  const email = `foo${random}@example.com`
  const oldPassword = 'oldpassword'
  const newPassword = 'newpassword'
  const credentials = {email, password: oldPassword}
  return axios.post(`${host}/users`, credentials)
    .then(() => getCookie(credentials))
    .then(cookie =>
      changePassword(cookie)
      .send({junk: 'something something'})
      .expectStatus(400)
      .end()
      .then(() =>
        changePassword(cookie)
        .send({password: newPassword})
        .expectStatus(200)
        .end()
      )
    )
    .then(() =>
      login()
      .send({email, password: oldPassword})
      .expectStatus(401)
      .end()
    )
    .then(() =>
      login()
      .send({email, password: newPassword})
      .expectStatus(200)
      .expectHeader('set-cookie', /.*/)
      .end()
    )
})

// === application ===

const getApplication = cookie =>
  api()
  .header('cookie', cookie)
  .get('/me/application')

const putApplication = cookie =>
  api()
  .header('cookie', cookie)
  .put('/me/application')

test.cb('application - unauthorized', t => {
  api()
  .get('/me/application')
  .send()
  .expectStatus(401)
  .end(t.end)
})

test.cb('application - new', t => {
  const random = (Math.random() + '').slice(2, 10)
  const credentials = {email: `foo${random}@example.com`, password: 'foobar'}
  axios.post(`${host}/users`, credentials)
    .then(() => getCookie(credentials))
    .then(cookie => {
      getApplication(cookie)
      .send()
      .expectStatus(404)
      .end(() => {
        putApplication(cookie)
        .send({})
        .expectStatus(200)
        .end(t.end)
      })
    })
})

test.cb('application - put empty', t => {
  getCookie().then(cookie => {
    putApplication(cookie)
    .send({})
    .expectStatus(200)
    .end(t.end)
  })
})

test.cb('application - put good', t => {
  getCookie().then(cookie => {
    putApplication(cookie)
    .send({firstName: 'Harry'})
    .expectStatus(200)
    .end(() => {
      getApplication(cookie)
      .expectValue('firstName', 'Harry')
      .end(t.end)
    })
  })
})

// === tech preferences ===

const putTechPreferences = cookie =>
  api()
  .header('cookie', cookie)
  .put('/me/application/techpreferences')

test.cb('techpreferences - unauthorized put', t => {
  api()
  .put('/me/application/techpreferences')
  .expectStatus(401)
  .end(t.end)
})

test.cb('techpreferences - good', t => {
  getCookie().then(cookie => {
    putTechPreferences(cookie)
    .send({React: 3})
    .expectStatus(200)
    .expect((res, body, next) => {
      t.is(body.React, 3)
      next()
    })
    .end(t.end)
  })
})

test.cb('techpreferences - bad value', t => {
  getCookie().then(cookie => {
    putTechPreferences(cookie)
    .send({React: 4})
    .expectStatus(400)
    .end(t.end)
  })
})

test.cb('techpreferences - junk', t => {
  getCookie().then(cookie => {
    putTechPreferences(cookie)
    .send({Junk: 0})
    .expectStatus(400)
    .end(t.end)
  })
})
