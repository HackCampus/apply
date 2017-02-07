/*

This is the OAuth decision tree.
The names of the tests at specific points in the tree are labelled (A), (B), etc.

did we get a token from service?
yes:
  did we get a user profile?
  yes:
    does a user with the same service id exist?
    yes:
      does that user have the same email as the one we got from service?
      yes: (B)
        user's access token should be updated
        user should be authenticated
      no:
        does that email already exist & has a password auth?
        yes: (C)
          the user should get an error saying they should log in with email & password
        no: (D)
          user should be authenticated
    no:
      does a user with that email address exist already?
      yes:
        a new authentication object should be created and associated with that user
      no: (A)
        a new user & authentication should be created
  no:
    did we get a 'bad credentials' message from service?
    yes:
      ?
    no:
      ?
no:
  did we get a 401 from service?
  yes:
    ?
  no:
    ?
*/

const test = require('ava')
const axios = require('axios')
const nock = require('nock')
const sinon = require('sinon')

// nock.recorder.rec()
const port = require('./_serve')()
const host = `http://127.0.0.1:${port}`

const {User, Authentication} = require('../database')

const randomId = () => (''+Math.random()).slice(2, 8)

const githubCallback = () =>
  axios.get(`${host}/auth/github/callback?code=FAKECALLBACKCODEPLZ`)

const mockAccessTokenRequest = token =>
  nock('https://github.com:443')
    .post('/login/oauth/access_token')
    .reply(200, `access_token=${token}&scope=user%3Aemail&token_type=bearer`, [ 'Server',
    'GitHub.com',
    'Date',
    'Wed, 28 Dec 2016 16:29:50 GMT',
    'Content-Type',
    'application/x-www-form-urlencoded; charset=utf-8',
    'Transfer-Encoding',
    'chunked',
    'Connection',
    'close',
    'Status',
    '200 OK',
    'Cache-Control',
    'no-cache',
    ])

const mockUserProfileRequest = id =>
  nock('https://api.github.com:443')
    .get('/user')
    .reply(200, {"login":"lachenmayer","id": id,"avatar_url":"https://avatars.githubusercontent.com/u/38614?v=3","gravatar_id":"","url":"https://api.github.com/users/lachenmayer","html_url":"https://github.com/lachenmayer","followers_url":"https://api.github.com/users/lachenmayer/followers","following_url":"https://api.github.com/users/lachenmayer/following{/other_user}","gists_url":"https://api.github.com/users/lachenmayer/gists{/gist_id}","starred_url":"https://api.github.com/users/lachenmayer/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/lachenmayer/subscriptions","organizations_url":"https://api.github.com/users/lachenmayer/orgs","repos_url":"https://api.github.com/users/lachenmayer/repos","events_url":"https://api.github.com/users/lachenmayer/events{/privacy}","received_events_url":"https://api.github.com/users/lachenmayer/received_events","type":"User","site_admin":false,"name":"Harry Lachenmayer","company":null,"blog":"https://keybase.io/lachenmayer","location":null,"email":"harrylachenmayer@gmail.com","hireable":null,"bio":null,"public_repos":34,"public_gists":10,"followers":23,"following":14,"created_at":"2008-12-05T22:44:31Z","updated_at":"2016-12-26T05:43:27Z"}, [ 'Server',
    'GitHub.com',
    'Date',
    'Wed, 28 Dec 2016 16:29:51 GMT',
    'Content-Type',
    'application/json; charset=utf-8',
    'Content-Length',
    '1204',
    'Connection',
    'close',
    'Status',
    '200 OK',])

const mockUserEmailsRequest = emails => {
  if (!Array.isArray(emails)) throw 'make emails an array'
  const response = emails.map(email => ({email, primary: false, verified: true}))
  if (response[0]) response[0].primary = true
  return nock('https://api.github.com:443')
    .get('/user/emails')
    .reply(200, response, [ 'Server',
    'GitHub.com',
    'Date',
    'Wed, 28 Dec 2016 16:29:51 GMT',
    'Content-Type',
    'application/json; charset=utf-8',
    'Content-Length',
    '137',
    'Connection',
    'close',
    'Status',
    '200 OK',
    ])
}

const mockGithubCallback = (accessToken = 'FAKETOKEN', userId = '123456', emails = ['foo@bar.baz']) => {
  const accessTokenRequest = mockAccessTokenRequest(accessToken)
  const userRequest = mockUserProfileRequest(userId)
  const emailsRequest = mockUserEmailsRequest(emails)
  return githubCallback()
}

test('github oauth flow requests get made', t => {
  const accessToken = mockAccessTokenRequest()
  const user = mockUserProfileRequest('faketoken')
  const emails = mockUserEmailsRequest(['fakeemail@foo.bar'])
  return githubCallback().then(res => {
    t.true(accessToken.isDone())
    t.true(user.isDone())
    t.true(emails.isDone())
  })
})

test('(A) creates a new user', t => {
  const createNewUser = sinon.spy(User, 'createWithToken')

  const id = randomId()
  const accessToken = 'FAKEACCESSTOKENPLZ' + id
  const email = id + 'fake@foo.bar'
  return mockGithubCallback('FAKEACCESSTOKENPLZ' + id, id, [id + 'fake@foo.bar'])
    .then(res => {
      t.is(res.status, 200)
      t.true(createNewUser.called)
    })
})

test('(B) updates access token for an existing user with matching email', t => {
  const updateAuthentication = sinon.spy(User.prototype, 'updateAuthentication')

  const firstId = randomId()
  const firstAccessToken = 'firstAccessToken' + firstId

  const secondId = randomId()
  const secondAccessToken = 'secondAccessToken' + secondId

  const email = firstId + 'fake@foo.bar'

  return mockGithubCallback(firstAccessToken, firstId, [email])
    .then(res => {
      return mockGithubCallback(secondAccessToken, firstId, [email])
    }).then(res => {
      t.is(res.status, 200)
      t.true(updateAuthentication.called)
      const args = updateAuthentication.args[0]
      const {type, identifier, token} = args[0]
      t.is(identifier, firstId)
      t.is(token, secondAccessToken)
      t.is(type, 'github')
      t.false(updateAuthentication.threw())
      updateAuthentication.restore()
    })
})

test('(C) can not authenticate with oauth if there is an existing password auth', t => {
  const email = randomId() + 'asdf@asd.df'
  t.fail('TODO')
  // return axios.post(`${host}/users`, {email, password: 'watever'})
  //   .then(res => {
  //     t.is(res.status, 201)
  //     // ...
  //   })
})

test("(D) update an existing user's email address", t => {
  t.fail('TODO')
  // const updateAuthentication = sinon.spy(User.prototype, 'updateAuthentication')
  //
  // const firstId = randomId()
  // const firstAccessToken = 'firstAccessToken' + firstId
  // const firstEmail = firstId + 'fake@foo.bar'
  //
  // const secondId = randomId()
  // const secondAccessToken = 'secondAccessToken' + secondId
  // const secondEmail = secondId + 'fake@foo.bar'
  //
  // return mockGithubCallback(firstAccessToken, firstId, [firstEmail])
  //   .then(res => {
  //     return mockGithubCallback(secondAccessToken, firstId, [secondEmail])
  //   }).then(res => {
  //     t.is(res.status, 200)
  //     return new User({email: secondEmail}).fetch()
  //   }).then(user => {
  //     t.truthy(user)
  //   })
})
