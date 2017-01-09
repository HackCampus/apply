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
  html`<div class="field"><p>${label}:</p>\xA0\xA0${content}</div>`

const listField = (label, content /* array */) =>
  html`<div class="field"><p>${label}:</p>${content.map(content => html`<p>\xA0\xA0 - ${content}</p>`)}</div>`

module.exports = Component({
  children: {
    email: validatedTextField({format: 'email'}, {autocomplete: 'email'}),
    password: passwordField({minLength: 6}),
    confirmPassword: passwordField({minLength: 6}),
    changePassword: passwordField({minLength: 6}),
    confirmChangePassword: passwordField({minLength: 6}),
  },
  init () {
    return {
      model: {
        // TODO password/changePassword should probably go in one string/"enum" field
        // because they're mutually exclusive (need to be authenticated to change password).
        password: false,
        changePassword: false,
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
      case 'changePassword':
        return {model, effect: a}

      case 'showPasswordFields': {
        const newModel = u({password: true}, model)
        return {model: newModel, effect: null}
      }

      case 'showChangePasswordFields': {
        const newModel = u({changePassword: true}, model)
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

      case 'loadUserSuccess': {
        const newModel = u({user: a.payload}, model)
        return {model: newModel, effect: null}
      }
      case 'loadUserError': {
        console.error(a.payload)
        return {model, effect: null}
      }

      case 'changePasswordSuccess': {
        const newModel = u({changePassword: false}, model)
        return {model: newModel, effect: null}
      }
      case 'changePasswordError': {
        console.error(a.payload)
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
              case 'OK': return action('loadUserSuccess', data)
              default: return action('loadUserError', data)
            }
          })
        )
      }
      case 'changePassword': {
        const password = effect.payload
        return pull(
          api.put('/me/password', {password}),
          pull.map(({statusText, data}) => {
            switch (statusText) {
              case 'OK': return action('changePasswordSuccess', data)
              default: return action('changePasswordError', data)
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
    const {
      user,
      changePassword,
    } = model
    const {email} = user
    return html`
      <div class="authenticated">
        You are authenticated as <strong>${email}</strong>.
        <div class="margin">
          ${listField('Actions', [
            html`<a href="/signout">Sign out</a>`,
            link('Change password', () => dispatch(action('showChangePasswordFields'))),
          ])}
        </div>
        ${changePassword ? this.changePasswordView(model, dispatch, children) : ''}
      </div>
    `
  },
  changePasswordView (model, dispatch, children) {
    const changePasswordField = model.children.changePassword
    const password = changePasswordField.value
    const confirmChangePasswordField = model.children.confirmChangePassword
    const confirmPassword = confirmChangePasswordField.value
    const enabled = password === confirmPassword
    const changePassword = () => enabled && dispatch(action('changePassword', password))
    return html`
      <div class="margin">
        ${field('new password', children.changePassword({onEnter: changePassword}))}
        ${field('confirm new password', children.confirmChangePassword({onEnter: changePassword}))}
        <div class="field">${link('Change password', changePassword, {class: enabled ? '' : 'disabled'})}</div>
      </div>
    `
  },
  notAuthenticatedView (model, dispatch, children) {
    return html`
      <div>
        ${listField('Authentication method', [
          link('GitHub', () => dispatch(action('oauth', 'github'))),
          link('LinkedIn', () => dispatch(action('oauth', 'linkedin'))),
          link('email/password', () => dispatch(action('showPasswordFields'))),
        ])}
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
      <div class="margin">
        ${listField('Actions', [
          radio(tabs.newApplication, 'Register - start a new application'),
          radio(tabs.existingApplication, 'Log in - edit an existing application'),
        ])}
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
        <div class="margin">
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
        <div class="field">${link('Register with email/password', register, {class: valid ? 'enabled' : 'disabled'})}</div>
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
        <div class="margin">
          ${field('email', children.email({onEnter: login}))}
          ${field('password', children.password({onEnter: login}))}
          <div>
            ${model.error === errors.loginIncorrect ? html`
              <span class="error">Your login details are incorrect. :(</span>
              ` : ''}
          </div>
        </div>
        <div class="field">${link('Log in with email/password', login, {class: valid ? 'enabled' : 'disabled'})}</div>
      </div>
    `
  },
})
