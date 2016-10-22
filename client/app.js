const {pull, html} = require('inu')
const isEmpty = require('lodash/isempty')
const u = require('updeep')
const extend = require('xtend')

const action = (type, payload) => ({type, payload})

const api = require('./api')
const Component = require('./component')
const getFormResponses = require('./getFormResponses')

const authenticate = require('./components/authenticate')
const link = require('./components/link')
const personalDetails = require('./components/personalDetails')
const techPreferences = require('./components/techPreferences')
const questions = require('./components/questions')

const noErrors = u({
  errorFields: u.constant({}), // FIXME if we don't add u.constant, fields never get removed because of how updeep works
  errorMessage: null,
  readOnly: false,
})

const serverError = u({
  errorFields: u.constant({}),
  errorMessage: 'Something is wrong with the server - please let us know at contact@hackcampus.io. Thank you! :)',
  readOnly: false,
})

module.exports = Component({
  children: {
    authenticate,
    personalDetails,
    techPreferences,
    questions,
  },
  init () {
    return {
      model: {
        user: null,
        application: null,
        readOnly: false,
        errorFields: {},
        errorMessage: null,
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
      case 'saveApplication': {
        const personalDetailsResponses = getFormResponses(model.children.personalDetails)
        if (personalDetailsResponses.contactEmail &&
            personalDetailsResponses.contactEmail.length === 0) {
          personalDetailsResponses.contactEmail = user.email
        }
        const techPreferencesResponses = getFormResponses(model.children.techPreferences)
        const questionsResponses = getFormResponses(model.children.questions)
        const application = extend(personalDetailsResponses, questionsResponses)

        const effect = [action('saveApplication', application)]
        if (!isEmpty(techPreferencesResponses)) {
          effect.push(action('saveTechPreferences', techPreferencesResponses))
        }
        const newModel = model // TODO
        return {model: newModel, effect}
      }
      case 'saveApplicationSuccess': {
        const newModel = noErrors(model)
        return {model: newModel, effect: null}
      }
      case 'saveApplicationUserError': {
        const errors = payload.errors
        const errorFields = {}
        for (let field of errors) {
          errorFields[field] = true
        }
        const newModel = u({
          errorMessage: 'There were some issues with your responses, please take a look at the ones highlighted in red.',
          errorFields: u.constant(errorFields),
          readOnly: false,
        }, model)
        return {model: newModel, effect: null}
      }
      case 'saveApplicationError': {
        const newModel = serverError(model)
        return {model: newModel, effect: null}
      }
      case 'saveTechPreferencesSuccess': {
        const newModel = noErrors(model)
        const techPreferences = payload
        const newModel_ = u({application: {techPreferences}}, newModel)
        return {model: newModel_, effect: null}
      }
      case 'saveTechPreferencesError': {
        const newModel = serverError(model)
        return {model: newModel, effect: null}
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
      <div class="apply">
        <h1>Apply to HackCampus</h1>
        ${section('step0', 'Step 0: Authenticate', children.authenticate())}
        ${section('step1', 'Step 1: Personal details', user ? children.personalDetails(props) : '')}
        ${section('step2', 'Step 2: Tech preferences', user ? children.techPreferences(props) : '')}
        ${section('step3', 'Step 3: Personal & technical questions', user ? children.questions(props) : '')}
        <div class="toolbar">${link('Save', () => dispatch(action('saveApplication')))}</div>
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
      case 'saveApplication': {
        const application = effect.payload
        return pull(
          api.put('/me/application', application),
          pull.map(({statusText, data}) => {
            switch (statusText) {
              case 'OK': return action('saveApplicationSuccess', data)
              case 'Bad Request': return action('saveApplicationUserError', data)
              default: return action('saveApplicationError', data)
            }
          })
        )
      }
      case 'saveTechPreferences': {
        const techPreferences = effect.payload
        return pull(
          api.put('/me/application/techpreferences', techPreferences),
          pull.map(({statusText, data}) => {
            switch (statusText) {
              case 'OK': return action('saveTechPreferencesSuccess', data)
              default: return action('saveTechPreferencesError', data)
            }
          })
        )
      }
    }
  },
})
