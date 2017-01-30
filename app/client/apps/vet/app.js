const {pull, html} = require('inu')

const action = require('../../lib/action')
const api = require('../../lib/api')
const Component = require('../../lib/component')

module.exports = Component({
  children: {},
  init () {
    return {
      model: {},
      effect: action('fetchApplications'),
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
      <div>hello vetting world!</div>
    `
  },
  run (effect, sources, action) {
    const get = (url, handler) =>
      pull(api.get(url), pull.map(handler))
    const put = (url, body, handler) =>
      pull(api.put(url, body), pull.map(handler))
    switch (effect.type) {
      case 'fetchApplications':
        return get('/applications', ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('fetchApplicationsSuccess', data)
            default: return action('fetchApplicationsError', data)
          }
        })
      default:
        return null
    }
  }
})
