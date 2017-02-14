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
      model: {
        user: null,
        unauthorized: false,
        companies: [],
      },
      effect: action('waitForUser'),
    }
  },
  update (model, {type, payload}) {
    switch (type) {
      case 'authenticated': {
        const newModel = u({user: payload}, model)
        return {model: newModel, effect: action('fetchCompanies')}
      }
      case 'fetchCompaniesSuccess': {

      }
      case 'fetchCompaniesUnauthorized': {
        const newModel = u({unauthorized: true}, model)
        return {model: newModel, effect: null}
      }
      case 'fetchCompaniesFailure':
        console.error({type, payload})
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    const {
      user,
    } = model
    return html`
      <div class="companies">
        <h1>Apply to HackCampus</h1>
        <p>If you have been shortlisted for this year's internship programme, you will be able to see which companies we are working with this year. You will be able to choose your preferred companies here, and we will do our best to match you with the companies you have chosen. Note that it is up to the companies to decide which applicants they want to interview, so you may be matched with a company that you did not specifically choose as a preference here.</p>
        <h2>Step 0: Authenticate</h2>
        ${children.authenticate()}
        ${user ? this.step1View(model, dispatch, children) : ''}
      </div>
    `
  },
  step1View (model, dispatch, children) {
    const {
      unauthorized,
    } = model
    return html`<div class="step1">
      <h2>Step 1: Choose companies</h2>
      ${unauthorized
        ? html`<p class="error">We're sorry, at this stage of the application process you can not give us your company preferences. If you think that this is an error, please let us know by email.</p>`
        : this.companiesView(model, dispatch, children)}
    </div>`
  },
  companiesView (model, dispatch, children) {
    const {
      companies,
    } = model
    return html`<div class="companiesList">
      ${companies.map(company => html`${JSON.stringify(company)}`)}
    </div>`
  },
  run (effect, sources, action) {
    const get = (url, handler) =>
      pull(api.get(url), pull.map(handler))
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
      case 'fetchCompanies': {
        return get('/companies', ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('fetchCompaniesSuccess', data)
            case 'Unauthorized': return action('fetchCompaniesUnauthorized')
            default: return action('fetchCompaniesFailure', data)
          }
        })
      }
    }
  }
})
