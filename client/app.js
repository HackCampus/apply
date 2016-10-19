const {pull, html} = require('inu')
const u = require('updeep')

const action = (type, payload) => ({type, payload})

const Component = require('./component')
const either = require('./pull-either')

const authenticate = require('./components/authenticate')
const personalDetails = require('./components/personalDetails')

module.exports = Component({
  children: {
    authenticate,
    personalDetails,
  },
  init () {
    return {
      model: {},
      effect: null,
    }
  },
  update (model, action) {
    switch (action.type) {
      case 'registered':
        return {model, effect: action('login')}
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    const user = model.children.authenticate.user
    const section = (name, header, content) => html`
      <div class="${name}">
        <h2>${header}</h2>
        <div>${content}</div>
      </div>
    `
    return html`
      <div>
        <h1>Apply to HackCampus</h1>
        ${section('step0', 'Step 0: Authenticate', children.authenticate())}
        ${section('step1', 'Step 1: Personal details', user ? children.personalDetails({user}) : '')}
        ${section('step2', 'Step 2: Tech preferences', '')}
        ${section('step3', 'Step 3: Personal & technical questions', '')}
      </div>
    `
  }
})