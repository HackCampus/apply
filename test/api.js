const hippie = require('hippie')
hippie.assert.showDiff = true

const end = test => (err, res, body) => {
  console.log(test)
  if (err) {
    console.log(body)
    throw err
  }
}

const api = () =>
  hippie()
  .json()
  .base('http://localhost:3000')


// === register ===

const register = () =>
api()
.post('/~')

register()
.send({weird: 'stuff'})
.expectStatus(400)
.end(end('junk'))

register()
.send({name: 1337, email: 'not an email'})
.expectStatus(400)
.end(end('wrong types'))

register()
.send({name: 'lachenmayer', email: 'foo@bar.baz', authentication: {type: 'password', token: 'foobar'}})
.expectStatus(409)
.end(end('already taken'))
