const axios = require('axios')
const {html, pull} = require('inu')
const promiseToPull = require('pull-promise')
const u = require('updeep')

const errors = require('../../errors')

const api = require('../api')
const Component = require('../component')

const link = require('./link')
const validatedTextField = require('./validatedTextField')
const passwordField = require('./passwordField')

const action = (type, payload) => ({type, payload})

const tabs = {
  newApplication: 0,
  existingApplication: 1,
}

const field = (label, content) =>
  html`<div class="field"><span>${label}:</span><br />\xA0\xA0${content}</div>`

module.exports = Component({
  children: {
    email: validatedTextField({format: 'email'}, {autocomplete: 'email'}),
    password: passwordField({minLength: 6}),
    confirmPassword: passwordField({minLength: 6}),
  },
  init () {
    return {
      model: {
        password: false,
        tab: tabs.newApplication,
        error: null,
        user: null,
      },
      effect: action('loadUser'),
    }
  },
  update (model, a) {
    switch (a.type) {
      // effects
      case 'register':
      case 'login':
      case 'oauth':
      case 'loadUser':
        return {model, effect: a}

      case 'password': {
        const newModel = u({password: true}, model)
        return {model: newModel, effect: null}
      }

      case 'select': {
        const newModel = u({tab: a.payload}, model)
        return {model: newModel, effect: null}
      }

      case 'registerSuccess': {
        const email = model.children.email.value
        const password = model.children.password.value
        return {model, effect: action('login', {email, password})}
      }
      case 'registerError': {
        const newModel = u({error: a.payload}, model)
        return {model: newModel, effect: null}
      }

      case 'loginSuccess': {
        return {model, effect: action('loadUser')}
      }
      case 'loginError': {
        const newModel = u({error: errors.loginIncorrect}, model)
        return {model: newModel, effect: null}
      }

      case 'userLoadedSuccess': {
        const newModel = u({user: a.payload}, model)
        return {model: newModel, effect: null}
      }
      case 'userLoadedError': {
        return {model, effect: null}
      }

      default:
        return {model, effect: null}
    }
  },
  run (effect, sources, action) {
    switch (effect.type) {
      case 'register': {
        const {email, password} = effect.payload
        return pull(
          api.post('/users', {email, password}),
          pull.map(({statusText, data}) => {
            switch (statusText) {
              case 'Created': return action('registerSuccess', data)
              default: return action('registerError', data)
            }
          })
        )
      }
      case 'login': {
        const {email, password} = effect.payload
        return pull(
          api.post('/auth/password', {email, password}),
          pull.map(({statusText, data}) => {
            switch (statusText) {
              case 'OK': return action('loginSuccess', data)
              default: return action('loginError', data)
            }
          })
        )
      }
      case 'oauth': {
        window.location.href = `/auth/${effect.payload}`
      }
      case 'loadUser': {
        return pull(
          api.get('/me'),
          pull.map(({statusText, data}) => {
            switch (statusText) {
              case 'OK': return action('userLoadedSuccess', data)
              default: return action('userLoadedError', data)
            }
          })
        )
      }
    }
  },

  view (model, dispatch, children) {
    return model.user
      ? this.authenticatedView(model, dispatch, children)
      : this.notAuthenticatedView(model, dispatch, children)
  },
  authenticatedView (model, dispatch, children) {
    const {user} = model
    return html`
      <div class="authenticated">
        You are authenticated as <strong>${user.email}</strong>. (<a href="/signout">Sign out</a>)
      </div>
    `
  },
  notAuthenticatedView (model, dispatch, children) {
    return html`
      <div class="form">
        <div class="field">
          <span>Authentication method:</span><br />
          \xA0\xA0- ${link('GitHub', () => dispatch(action('oauth', 'github')))}<br />
          \xA0\xA0- ${link('LinkedIn', () => dispatch(action('oauth', 'linkedin')))}<br />
          \xA0\xA0- ${link('email/password', () => dispatch(action('password')))}
        </div>
        ${model.password ? this.passwordView(model, dispatch, children) : ''}
      </div>
    `
  },
  passwordView (model, dispatch, children) {
    const select = id =>
      dispatch(action('select', id))
    const radio = (id, content) =>
      link(content, () => select(id), {class: model.tab === id ? 'disabled' : ''})
    return html`
      <div>
        ${radio(tabs.newApplication, 'Start a new application')} |
        ${radio(tabs.existingApplication, 'Edit an existing application')}
        ${(() => {
          switch (model.tab) {
            case tabs.newApplication:
              return this.newApplicationView(model, dispatch, children)
            case tabs.existingApplication:
              return this.existingApplicationView(model, dispatch, children)
          }
        })()}
      </div>
    `
  },
  newApplicationView (model, dispatch, children) {
    const emailField = model.children.email
    const passwordField = model.children.password
    const confirmPasswordField = model.children.confirmPassword
    const valid =
      emailField.started &&
      passwordField.started &&
      confirmPasswordField.started &&
      emailField.valid &&
      passwordField.valid &&
      confirmPasswordField.valid &&
      passwordField.value === confirmPasswordField.value
    const register = () => valid && dispatch(action('register', {email: emailField.value, password: passwordField.value}))
    return html`
      <div>
        <div class="entry">
          ${field('email', children.email({onEnter: register}))}
          ${field('password', children.password({onEnter: register}))}
          ${field('confirm password', children.confirmPassword({
            onEnter: register,
            confirmValue: passwordField.value
          }))}
          <div>
            ${model.error === errors.emailTaken ? html`
              <span class="error">An application has already been started with this email address.
              Do you want to try <a onclick=${() => dispatch(action('select', tabs.existingApplication))}>logging in with this email address?</a>
              </span>` : ''}
          </div>
        </div>
        <div>${link('Register with email/password', register, {class: valid ? 'enabled' : 'disabled'})}</div>
      </div>
    `
  },
  existingApplicationView (model, dispatch, children) {
    const emailField = model.children.email
    const passwordField = model.children.password
    const valid =
      emailField.started &&
      passwordField.started &&
      emailField.valid &&
      passwordField.valid
    const login = () => valid && dispatch(action('login', {email: emailField.value, password: passwordField.value}))
    return html`
      <div>
        <div class="entry">
          ${field('email', children.email({onEnter: login}))}
          ${field('password', children.password({onEnter: login}))}
          <div>
            ${model.error === errors.loginIncorrect ? html`
              <span class="error">Your login details are incorrect. :(</span>
              ` : ''}
          </div>
        </div>
        <div>${link('Log in with email/password', login, {class: valid ? 'enabled' : 'disabled'})}</div>
      </div>
    `
  },
})
