const authentication = {
  type: 'object',
  properties: {
    type: {enum: ['password']},
    identifier: {type: 'string'},
    token: {type: 'string'},
  },
  required: ['type', 'token'],
}

const password = {type: 'string', minLength: 6, maxLength: 72}

const user = {
  type: 'object',
  properties: {
    name: {type: 'string', maxLength: 32, pattern: '^[\\w\\d\\._-]+$'},
    email: {type: 'string', format: 'email'},
    authentication,
  },
  required: ['name', 'email', 'authentication'],
}

module.exports = {
  authentication,
  password,
  user,
}
