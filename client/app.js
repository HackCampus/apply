const {pull, html} = require('inu')
const u = require('updeep')

const action = (type, payload) => ({type, payload})

const Component = require('./component')
const either = require('./pull-either')

const authenticate = require('./components/authenticate')
const contactDetails = require('./components/contactDetails')

module.exports = Component({
  children: {
    authenticate,
    contactDetails,
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
        ${section('step1', 'Step 1: Contact details', children.contactDetails())}
      </div>
    `
  }
})
