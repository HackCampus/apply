const {html} = require('inu')
const u = require('updeep')

const action = (type, payload) => ({type, payload})

const Component = require('./component')

const authenticate = require('./components/authenticate')

module.exports = Component({
  children: {
    authenticate,
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
  run (effect, sources) {
    if (effect.child === 'authenticate') {
      const authenticateEffect = effect.effect
      switch (authenticateEffect.type) {
        case 'password': {
          const {email, password} = authenticateEffect.payload
        }
      }
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
      </div>
    `
  }
})
