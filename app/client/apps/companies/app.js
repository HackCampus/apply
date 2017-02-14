const {pull, html} = require('inu')
const u = require('updeep')

const action = require('../../lib/action')
const api = require('../../lib/api')
const Component = require('../../lib/component')

const authenticate = require('../../components/authenticate')

module.exports = Component({
  children: {
    authenticate,
  },
  init () {
    return {
      model: {},
      effect: action('waitForUser'),
    }
  },
  update (model, {type, payload}) {
    switch (type) {
      case 'authenticated': {
        const newModel = u({user: payload}, model)
        return {model: newModel, effect: null}
      }
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    return html`
      <div class="companies">
        ${children.authenticate()}
      </div>
    `
  },
  run (effect, sources, action) {
    // const get = (url, handler) =>
    //   pull(api.get(url), pull.map(handler))
    switch (effect.type) {
      case 'waitForUser': {
        return pull(
          sources.models(),
          pull.map(model => model.children.authenticate.user),
          pull.filter(user => user != null),
          pull.take(1),
          pull.map(user => action('authenticated', user))
        )
      }
    }
  }
})
