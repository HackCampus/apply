const roles = require('../roles')
const limitToRole = require('./limitToRole')

module.exports = unauthorizedRedirect =>
  limitToRole(roles.matcher, unauthorizedRedirect)
