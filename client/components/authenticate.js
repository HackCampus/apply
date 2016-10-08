const {html} = require('inu')
const u = require('updeep')

const Component = require('../component')

const validatedTextField = require('./validatedTextField')
const passwordField = require('./passwordField')

const action = (type, payload) => ({type, payload})

const tabs = {
  newApplication: 0,
  existingApplication: 1,
}

module.exports = Component({
  children: {
    email: validatedTextField({format: 'email'}),
    password: passwordField({minLength: 6}),
  },
  init () {
    return {
      model: {
        tab: tabs.newApplication,
      },
      effect: null,
    }
  },
  update (model, a) {
    switch (a.type) {
      case 'select': {
        const newModel = u({tab: a.payload}, model)
        return {model: newModel, effect: null}
      }
      case 'password': {
        const email = model.children.email.value
        const password = model.children.password.value
        return {model, effect: action('password', {email, password})}
      }
      case 'github': {
        return {model, effect: action('github')}
      }
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    const select = id =>
      dispatch(action('select', id))
    const radio = (id, content) =>
      html`<div class="tab" onclick=${() => select(id)}>- [${id === model.tab ? 'x' : ' '}] <a href="#" class="tab-content">${content}</a></div>`
    const emailField = model.children.email
    const passwordField = model.children.password
    const enabled = emailField.started && passwordField.started && emailField.valid && passwordField.valid
    return html`
      <div class="form">
        ${radio(tabs.newApplication, 'Start a new application')}
        ${radio(tabs.existingApplication, 'Edit an existing application')}
        <div>\xA0\xA0\xA0\xA0email: ${children.email()}</div>
        <div>\xA0\xA0\xA0\xA0password: ${children.password()}</div>
        <div>\xA0\xA0\xA0\xA0<a href="#" class=${enabled ? 'enabled' : 'disabled'} onclick=${() => enabled && dispatch(action('password'))}>Authenticate with email/password</a></div>
        <div>\xA0\xA0\xA0\xA0</div>
        <div>\xA0\xA0\xA0\xA0<em>or</em></div>
        <div>\xA0\xA0\xA0\xA0</div>
        <div>\xA0\xA0\xA0\xA0<a href="#" onclick=${() => dispatch(action('github'))}>Authenticate with GitHub</a></div>
      </div>
    `
  }
})
