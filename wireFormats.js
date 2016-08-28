const user = {
  type: 'object',
  properties: {
    name: {type: 'string'},
    email: {type: 'string', format: 'email'},
  },
  required: ['name', 'email'],
}

module.exports = {
  user,
}
