const {pull, html} = require('inu')
const u = require('updeep')

const action = require('../../lib/action')
const api = require('../../lib/api')
const Component = require('../../lib/component')

const applicationView = require('../../components/applicationView')

module.exports = Component({
  children: {
    // TODO add children...
  },
  init () {
    return {
      model: {
        application: null,
      },
      effect: action('fetchApplication'),
    }
  },
  update (model, action) {
    switch (action.type) {
      case 'fetchApplicationSuccess': {
        const newModel = u({application: action.payload}, model)
        return {model: newModel, effect: null}
      }
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    const {
      application,
    } = model
    return html`
      <div class="matchDetail">
        ${applicationView(application)}
      </div>
    `
  },
  run (effect, sources, action) {
    const get = (url, handler) =>
      pull(api.get(url), pull.map(handler))
    switch (effect.type) {
      case 'fetchApplication': {
        const id = window.location.pathname.match(/application\/([^/]+)/)[1]
        return get(`/applications/${id}`, ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('fetchApplicationSuccess', data)
            default: return action('fetchApplicationFailure')
          }
        })
      }
    }
  }
})
