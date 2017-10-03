const axios = require('axios');
const { html, pull } = require('inu');
const promiseToPull = require('pull-promise');
const u = require('updeep');

const errors = require('../../errors');

const api = require('../lib/api');
const Component = require('../lib/component');

const link = require('./link');
const validatedTextField = require('./validatedTextField');
const passwordField = require('./passwordField');

const action = (type, payload) => ({ type, payload });

const field = (label, content) => html`<div class="field"><p>${label}:</p>\xA0\xA0${content}</div>`;

const listField = (label, content /* array */) => html`<div class="field"><p>${label}:</p>${content.map(content => html`<p>\xA0\xA0 - ${content}</p>`)}</div>`;

// TODO unify with authenticate.js
module.exports = Component({
  children: {
    email: validatedTextField({ format: 'email' }, { autocomplete: 'email' }),
    password: passwordField()
  },
  init() {
    return {
      model: {
        // TODO password/changePassword should probably go in one string/"enum" field
        // because they're mutually exclusive (need to be authenticated to change password).
        password: false,
        error: null
      },
      effect: action('loadUser')
    };
  },
  update(model, a) {
    switch (a.type) {
      // effects
      case 'login':
      case 'loadUser':
        return { model, effect: a };

      case 'loginSuccess':
        {
          return { model, effect: action('loadUser') };
        }
      case 'loginError':
        {
          const newModel = u({ error: errors.loginIncorrect }, model);
          return { model: newModel, effect: null };
        }

      case 'loadUserSuccess':
        {
          const newModel = u({ user: a.payload }, model);
          return { model: newModel, effect: null };
        }
      case 'loadUserError':
        {
          return { model, effect: null };
        }

      default:
        return { model, effect: null };
    }
  },
  run(effect, sources, action) {
    switch (effect.type) {
      case 'login':
        {
          const { email, password } = effect.payload;
          return pull(api.post('/auth/password', { email, password }), pull.map(({ statusText, data }) => {
            switch (statusText) {
              case 'OK':
                return action('loginSuccess', data);
              default:
                return action('loginError', data);
            }
          }));
        }
      case 'loadUser':
        {
          return pull(api.get('/me'), pull.map(({ statusText, data }) => {
            switch (statusText) {
              case 'OK':
                return action('loadUserSuccess', data);
              default:
                return action('loadUserError', data);
            }
          }));
        }
    }
  },

  view(model, dispatch, children) {
    const emailField = model.children.email;
    const passwordField = model.children.password;
    const valid = emailField.started && passwordField.started && emailField.valid && passwordField.valid;
    const login = () => valid && dispatch(action('login', { email: emailField.value, password: passwordField.value }));
    return html`
      <div>
        <div class="margin">
          ${field('email', children.email({ onEnter: login }))}
          ${field('password', children.password({ onEnter: login }))}
          <div>
            ${model.error === errors.loginIncorrect ? html`
              <span class="error">Your login details are incorrect. :(</span>
              ` : ''}
          </div>
        </div>
        <div class="field">${link('Log in with email/password', login, { class: valid ? 'enabled' : 'disabled' })}</div>
      </div>
    `;
  }
});