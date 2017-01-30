const {pull, html} = require('inu')

const Component = require('../../lib/component')

const login = require('../../components/login')

module.exports = Component({
  children: {
    login,
  },
  init () {
    return {
      model: {},
      effect: null,
    }
  },
  update (model, action) {
    switch (action.type) {
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
  run (effect, sources, action) {}
})
