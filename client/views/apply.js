const {html, pull} = require('inu')
const {Action, Domain} = require('inux')
const jsonSchema = require('jsonschema')
const updeep = require('updeep')

const api = require('../api')
const errors = require('../../errors')
const fields = require('../fields')
const {either} = require('../pull')
const wireFormats = require('../../wireFormats')

const actions = {
  input: Symbol('input'),
  submit: Symbol('submit')
}
const input = Action(actions.input)
const submit = Action(actions.submit)

const responses = {
  registerResponse: Symbol('registerResponse'),
}
const registerResponse = Action(responses.registerResponse)

const goSymbol = Symbol('go')
const go = Action(goSymbol)

const model = {
  fields: {
    name: '',
    email: '',
    password: '',
    'confirm password': '',
  },
  errors: {},
}

const formSchema = {
  id: 'apply',
  type: 'object',
  properties: {
    name: wireFormats.user.properties.name,
    email: wireFormats.user.properties.email,
    password: wireFormats.password,
    'confirm password': wireFormats.password,
  }
}

const validate = (label, value) =>
  jsonSchema.validate(value, formSchema.properties[label]).errors

const update = (model, action) => {
  const u = newState => ({model: updeep(newState, model)})
  switch (action.type) {
    case actions.input: {
      const {field, value} = action.payload
      const errors = validate(field, value)
      return u({
        fields: {[field]: value},
        errors: errors.length === 0 ? updeep.omit(field) : {[field]: true}
      }, model)
    }

    case actions.submit:
      return {model, effect: submit(model.fields)}

    case responses.registerResponse: {
      const {status, body} = action.payload
      switch (status) {
        case 'Created':
          const {name} = body
          return {model, effect: go(`/apply/${name}`)}
        case 'Conflict':
          const error = body
          switch (error) {
            case errors.emailTaken:
              return u({errors: {email: true}})
            case errors.nameTaken:
              return u({errors: {name: true}})
          }
      }
    }
  }
  return {model}
}

const run = (effect, sources) => {
  switch (effect.type) {
    case actions.submit: {
      const {name, email, password} = effect.payload
      const body = {name, email, authentication: {type: 'password', token: 'password'}}
      return pull(
        api.post('/~', body),
        either(registerResponse, error => {
          console.log(error)
        }))
    }

    case goSymbol:
      window.location = effect.payload
      return
  }
}

const view = (model, dispatch) => {
  const $ = (field, value) =>
    dispatch(input({field, value}))

  const name =
    fields.labelled('name', model.errors.name, 'text',
      html`<span><span class="demoUrl">hackcampus.io/~</span>${fields.text(model.fields.name, value => $('name', value))}</span>`)

  const text = label =>
    fields.labelled(label, model.errors[label], 'text',
      fields.text(model.fields[label], value => $(label, value)))

  const completed = fieldName =>
    model.fields[fieldName] && !model.errors[fieldName]

  return html`
    <div class="form">
      <h2>Apply to HackCampus</h2>
      ${name}
      ${text('email')}
      ${completed('name') && completed('email') ? authView(model, dispatch) : null}
    </div>
  `
}

const authView = (model, dispatch) => {
  const $ = (field, value) =>
    dispatch(input({field, value}))

  const password = label =>
    fields.labelled(label, model.errors[label], 'password',
      fields.password(model.fields[label], value => $(label, value)))

  const completed = fieldName =>
    model.fields[fieldName] && !model.errors[fieldName]

  const passwordButtonEnabled =
    completed('password') && completed('confirm password') && model.fields.password === model.fields['confirm password']

  return html`
    <div class="auth-form">
      ${password('password')}
      ${password('confirm password')}
      <button ${passwordButtonEnabled ? '' : 'disabled'} onclick=${() => dispatch(submit())}>Sign up with a password</button>
      <p>or</p>
      <button>Authenticate with GitHub</button>
    </div>
  `
}

module.exports = Domain({
  name: 'apply',
  init: () => ({model}),
  update,
  run,
  routes: [
    ['/apply', (_, model, dispatch) => view(model.apply, dispatch)]
  ]
})
