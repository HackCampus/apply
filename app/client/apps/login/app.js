const {pull, html} = require('inu')

const action = require('../../lib/action')
const Component = require('../../lib/component')

const login = require('../../components/login')

module.exports = Component({
  children: {
    login,
  },
  init () {
    return {
      model: {},
      effect: action('redirectMatchers'),
    }
  },
  update (model, action) {
    switch (action.type) {
      case 'unauthorized':
        console.error('not authorized')
        return {model, effect: null}
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    return html`
      <div class="login">
        ${children.login()}
      </div>
    `
  },
  run (effect, sources, action) {
    switch (effect.type) {
      case 'redirectMatchers': {
        return pull(
          sources.models(),
          pull.map(model => model.children.login.user),
          pull.filter(user => user != null),
          pull.take(1),
          pull.map(user => {
            if (user.role === 'matcher') {
              window.location.reload()
            } else {
              return action('unauthorized')
            }
          })
        )
      }
    }
  }
})
