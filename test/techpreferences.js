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

api()
.put('/test/techpreferences')
.send({React: 3})
.expectStatus(200)
.expectBody({React: 3})
.end(end('good'))

api()
.put('/test/techpreferences')
.send({React: 4})
.expectStatus(400)
.end(end('bad value'))

api()
.put('/test/techpreferences')
.send({Junk: 0})
.expectStatus(400)
.end(end('bad key'))
