const {pull} = require('inu')
const fetch = require('isomorphic-fetch')
const promiseToPull = require('pull-promise')
const extend = require('xtend')

const request = (url, method, options) =>
  fetch(url, extend({}, options, {
    method,
    cache: 'no-cache',
    credentials: 'include',
  }))
  .then(res => Promise.all([res.statusText, res.json()]))
  .then(([status, body]) => ({status, body}))

const getPromise = url =>
  request(url, 'GET')
const postPromise = (url, body) =>
  request(url, 'POST', {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  })

const get = url =>
  promiseToPull.source(getPromise(url))
const post = (url, body) =>
  promiseToPull.source(postPromise(url, body))

module.exports = {
  get,
  post,
}
