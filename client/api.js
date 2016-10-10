const axios = require('axios')
const {pull} = require('inu')
const promiseToPull = require('pull-promise')

const get = url =>
  promiseToPull.source(
    axios.get(url)
    .catch(error => error.response)
  )

const post = (url, body) =>
  promiseToPull.source(
    axios.post(url, body)
    .catch(error => error.response)
  )

module.exports = {
  get,
  post,
}
