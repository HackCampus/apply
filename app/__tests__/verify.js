const test = require('ava')
const sinon = require('sinon')

const oauthVerifyCallback = require('../routes/auth/oauthVerifyCallback')
const {User} = require('../database')

test.serial.cb('can log in with github access token', t => {
  const verify = oauthVerifyCallback('github')
  const profile = {
    id: '1337',
    emails: [{value: 'github-oauth-verify-test@foo.bar'}]
  }
  const noUserReq = {fake: true}
  verify(noUserReq, 'fakeaccesstoken', 'fakerefreshtoken', profile, function (err, user) {
    t.falsy(err)
    const email = user.email
    t.is(email, 'github-oauth-verify-test@foo.bar')
    t.end()
  })
})

test('"different user has already connected" message gets passed to error handler', async t => {
  const verify = oauthVerifyCallback('github')
  const profile = {
    id: '1337',
    emails: [{value: 'github-oauth-verify-test@foo.bar'}]
  }
  const user = await User.create({email: 'asdfasdfasdf@foo.bar'})
  return new Promise((resolve, reject) => {
    verify({user}, 'fakeaccesstoken', 'fakerefreshtoken', profile, function (err, user, errorMessage) {
      t.falsy(err)
      t.falsy(user)
      t.truthy(errorMessage.message)
      resolve()
    })
  })
})
