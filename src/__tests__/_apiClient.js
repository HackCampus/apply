const axios = require('axios')

module.exports = function apiClient (baseURL) {
  const api = axios.create({baseURL})
  return {
    register: data =>
      api.post('/users', data),
    login: data =>
      api.post('/auth/password', data),
    profile: cookie =>
      api.get('/me', cookie ? {headers: {cookie}} : {}),
    changePassword: (data, cookie) =>
      api.put('/me/password', data, cookie ? {headers: {cookie}} : {}),
    getApplication: cookie =>
      api.get('/me/application', cookie ? {headers: {cookie}} : {}),
    putApplication: (data, cookie) =>
      api.put('/me/application', data, cookie ? {headers: {cookie}} : {}),
    putTechPreferences: (data, cookie) =>
      api.put('/me/application/techpreferences', data, cookie ? {headers: {cookie}} : {}),
    githubCallback: (code = 'FAKECODE') =>
      api.get(`/auth/github/callback?code=${code}`),
  }
}
