const authentication = {
  type: 'object',
  properties: {
    type: {enum: ['password']},
    identifier: {type: 'string'},
    token: {type: 'string'},
  },
  required: ['type', 'token'],
}

const user = {
  type: 'object',
  properties: {
    name: {type: 'string'},
    email: {type: 'string', format: 'email'},
    authentication,
  },
  required: ['name', 'email', 'authentication'],
}

module.exports = {
  authentication,
  user,
}
