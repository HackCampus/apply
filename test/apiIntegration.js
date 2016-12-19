const test = require('ava')
const axios = require('axios')
const hippie = require('hippie')
const sinon = require('sinon')
const extend = require('xtend')
hippie.assert.showDiff = true

process.env.NODE_ENV = 'production'
require('../app') // serve

const api = () =>
  hippie()
  .json()
  .base('http://localhost:3000')

const testCredentials = {email: 'foo@bar.baz', password: 'foobar'}

const getCookie = credentialOverrides =>
  axios
    .post('http://localhost:3000/auth/password', extend(testCredentials, credentialOverrides))
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

test.cb('register - new account gets created response', t => {
  const random = (Math.random() + '').slice(2, 10)
  register()
  .send({email: `foo${random}@example.com`, password: 'foobar'})
  .expectStatus(201)
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

test.cb('login - works', t => {
  login()
  .send({email: 'foo@bar.baz', password: 'foobar'})
  .expectStatus(200)
  .expectHeader('set-cookie', /.*/)
  .end(t.end)
})

test.cb('login - wrong login gives you unauthorized response', t => {
  login()
  .send({email: 'foo@bar.baz', password: 'wrooooooong'})
  .expectStatus(401)
  .end(t.end)
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
  const log = sinon.spy(console, 'error')
  axios.post('http://localhost:3000/users', credentials)
    .then(() => getCookie(credentials))
    .then(cookie => {
      getApplication(cookie)
      .send()
      .expectStatus(404)
      .end(() => {
        putApplication(cookie)
        .send({})
        .expectStatus(200)
        .end(() => {
          t.false(log.called)
          t.end()
        })
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
    .expectBody({React: 3})
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
