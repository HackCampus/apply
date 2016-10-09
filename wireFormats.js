const authentication = {
  type: 'object',
  properties: {
    type: {enum: ['password', 'github']},
    identifier: {type: 'string'},
    token: {type: 'string'},
  },
  required: ['type', 'token'],
}

const password = {type: 'string', minLength: 6, maxLength: 72}

const register = {
  type: 'object',
  properties: {
    email: {type: 'string', format: 'email'},
    password,
  },
  required: ['email', 'password'],
}

module.exports = {
  authentication,
  password,
  register,
}
