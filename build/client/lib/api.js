const axios = require('axios');
const { pull } = require('inu');
const promiseToPull = require('pull-promise');

const pullAxios = promise => promiseToPull.source(promise.catch(error => error.response));

const get = url => pullAxios(axios.get(url));

const post = (url, body) => pullAxios(axios.post(url, body));

const put = (url, body) => pullAxios(axios.put(url, body));

// delete is a keyword
const delete_ = url => pullAxios(axios.delete(url));

module.exports = {
  get,
  post,
  put,
  delete: delete_
};