const {pull, html} = require('inu')
const u = require('updeep')

const action = (type, payload) => ({type, payload})

const api = require('./api')
const Component = require('./component')

const authenticate = require('./components/authenticate')
const link = require('./components/link')
const personalDetails = require('./components/personalDetails')
const techPreferences = require('./components/techPreferences')

module.exports = Component({
  children: {
    authenticate,
    personalDetails,
    techPreferences,
  },
  init () {
    return {
      model: {
        user: null,
        application: null,
        readOnly: false,
      },
      effect: action('waitForUser'),
    }
  },
  update (model, {type, payload}) {
    switch (type) {
      case 'authenticated': {
        const newModel = u({user: payload, readOnly: true}, model)
        return {model: newModel, effect: action('fetchApplication', payload.id)}
      }
      case 'fetchApplicationSuccess': {
        const newModel = u({application: payload, readOnly: false}, model)
        return {model: newModel, effect: null}
      }
      case 'fetchApplicationNotFound': {
        const newModel = u({readOnly: false}, model)
        return {model: newModel, effect: null}
      }
      case 'fetchApplicationError': {
        console.error({type, payload})
        return {model, effect: null}
      }
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    const {application, user, readOnly} = model
    const section = (name, header, content) => html`
      <div class="${name}">
        <h2>${header}</h2>
        <div>${content}</div>
      </div>
    `
    // readOnly may be also set by the subcomponent - don't override it unless needed
    const props = readOnly
      ? {application, user, readOnly}
      : {application, user}
    return html`
      <div>
        <h1>Apply to HackCampus</h1>
        ${section('step0', 'Step 0: Authenticate', children.authenticate())}
        ${section('step1', 'Step 1: Personal details', user ? children.personalDetails(props) : '')}
        ${section('step2', 'Step 2: Tech preferences', user ? children.techPreferences(props) : '')}
        ${section('step3', 'Step 3: Personal & technical questions', '')}
        <div class="toolbar">${link('Save')}</div>
      </div>
    `
  },
  run (effect, sources, action) {
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
      case 'fetchApplication': {
        const userId = effect.payload
        return pull(
          api.get(`/users/${userId}/application`),
          pull.map(({statusText, data}) => {
            switch (statusText) {
              case 'OK': return action('fetchApplicationSuccess', data)
              case 'Not Found': return action('fetchApplicationNotFound', data)
              default: return action('fetchApplicationError', data)
            }
          })
        )
      }
    }
  },
})
