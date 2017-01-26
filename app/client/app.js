const {pull, html} = require('inu')
const isEmpty = require('lodash.isempty')
const uninterrupted = require('./pull-uninterrupted')
const u = require('updeep')
const extend = require('xtend')

const constants = require('../constants')
const wireFormats = require('../wireFormats')

const api = require('./api')
const Component = require('./component')

const authenticate = require('./components/authenticate')
const completedBar = require('./components/completedBar')
const finishApplication = require('./components/finishApplication')
const link = require('./components/link')
const personalDetails = require('./components/personalDetails')
const questions = require('./components/questions')
const statusBar = require('./components/statusBar')
const techPreferences = require('./components/techPreferences')

const action = (type, payload) => ({type, payload})

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
    finishApplication,
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
        return {model: newModel, effect: action('fetchApplication')}
      }
      case 'fetchApplicationSuccess':
      case 'createApplicationSuccess': {
        const newModel = u({application: payload, readOnly: false}, model)
        return {model: newModel, effect: action('autosave')}
      }
      case 'fetchApplicationNotFound': {
        const newModel = u({readOnly: false}, model)
        return {model: newModel, effect: action('createApplication')}
      }
      case 'fetchApplicationError':
      case 'createApplicationError': {
        const newModel = serverError(newModel)
        return {model: newModel, effect: null}
      }
      case 'saveApplication': {
        const personalDetailsResponses = getFormResponses(model.children.personalDetails)
        if (personalDetailsResponses.contactEmail &&
            personalDetailsResponses.contactEmail.length === 0) {
          personalDetailsResponses.contactEmail = user.email
        }
        const techPreferencesResponses = getFormResponses(model.children.techPreferences)
        const questionsResponses = getFormResponses(model.children.questions)
        const application = extend(personalDetailsResponses, questionsResponses, payload)

        const effect = [action('saveApplication', application)]
        if (!isEmpty(techPreferencesResponses)) {
          effect.push(action('saveTechPreferences', techPreferencesResponses))
        }
        const newModel = u({
          statusMessage: 'Saving...',
        }, model)
        return {model: newModel, effect}
      }
      case 'saveApplicationSuccess': {
        const newModel = u({
          statusMessage: '',
          application: payload,
        }, noErrors(model))
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
      case 'connect': {
        return {model, effect: action('connect', payload)}
      }
      default:
        return {model, effect: null}
    }
  },
  run (effect, sources, action) {
    const get = (url, handler) =>
      pull(api.get(url), pull.map(handler))
    const put = (url, body, handler) =>
      pull(api.put(url, body), pull.map(handler))
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
      case 'createApplication': {
        return put('/me/application', {}, ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('createApplicationSuccess', data)
            default: return action('createApplicationError', data)
          }
        })
      }
      case 'fetchApplication': {
        return get('/me/application', ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('fetchApplicationSuccess', data)
            case 'Not Found': return action('fetchApplicationNotFound', data)
            default: return action('fetchApplicationError', data)
          }
        })
      }
      case 'saveApplication': {
        const application = effect.payload
        return put('/me/application', application, ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('saveApplicationSuccess', data)
            case 'Bad Request': return action('saveApplicationUserError', data)
            default: return action('saveApplicationError', data)
          }
        })
      }
      case 'saveTechPreferences': {
        const techPreferences = effect.payload
        return put('/me/application/techpreferences', techPreferences, ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('saveTechPreferencesSuccess', data)
            default: return action('saveTechPreferencesError', data)
          }
        })
      }
      case 'autosave': {
        return pull(
          sources.actions(),
          pull.filter(action =>
            ['personalDetails', 'techPreferences', 'questions'].indexOf(action.child) !== -1
          ),
          uninterrupted(3000),
          pull.map(() => action('saveApplication'))
        )
      }
      case 'connect': {
        // FIXME if the application hasn't saved on time, the latest data might be lost.
        // how to dispatch 'saveApplication', wait for 'saveApplicationSuccess' and only
        // then redirect?
        const provider = effect.payload
        window.location.href = `/connect/${provider}`
      }
    }
  },
  view (model, dispatch, children) {
    const {
      application,
      errorFields,
      errorMessage,
      statusMessage,
      user,
    } = model
    const section = (name, header, content) => html`
      <div class="${name}">
        <h2>${header}</h2>
        <div>${content}</div>
      </div>
    `
    const finishApplication = () =>
      dispatch(action('saveApplication', {finished: true}))
    const connect = provider =>
      dispatch(action('connect', provider))
    const completed = this.getCompleted(model)
    const oldApplication = application && application.programmeYear !== constants.programmeYear
    const finished = application && application.finishedAt != null && !oldApplication // people should be able to edit old applications, so that they can re-apply for this year
    const readOnly = model.readOnly || finished
    // readOnly may be also set by the subcomponent - don't override it unless needed
    const props = readOnly
      ? {application, user, errorFields, readOnly}
      : {application, user, errorFields}
    return html`
      <div class="apply">
        <h1>Apply to HackCampus</h1>
        <p>Welcome! This is the application form for the <a href="http://hackcampus.io/">HackCampus internship programme</a>. If something doesn't work, we'd appreciate it if you <a href="https://github.com/hackcampus/apply/issues">file an issue on GitHub</a> or email us at contact@hackcampus.io. Thanks! :)</p>
        ${section('step0', 'Step 0: Authenticate', children.authenticate())}
        ${section('step1', 'Step 1: Personal details', user ? children.personalDetails(extend(props, {connect})) : '')}
        ${section('step2', 'Step 2: Tech preferences', user ? children.techPreferences(props) : '')}
        ${section('step3', 'Step 3: Personal & technical questions', user ? children.questions(props) : '')}
        ${section('step4', 'Step 4: Finish your application', user ? children.finishApplication({
          completed,
          finished,
          finishApplication,
        }) : '')}
        ${statusBar(statusMessage, errorMessage)}
        ${completedBar(completed)}
      </div>
    `
  },
  getCompleted (model) {
    const application = model.application || {}
    const completed = {
      personalDetails: getCompleted(model.children.personalDetails, application),
      techPreferences: getCompleted(model.children.techPreferences, application.techPreferences),
      questions: getCompleted(model.children.questions, application),
    }
    for (let field in wireFormats.optionalFields) {
      delete completed.personalDetails[field]
    }
    return completed
  },
})

// Returns an object of booleans indicating whether the given field is completed (ie. not started).
const empty = x => x == null || x === ''
function getCompleted (model, previousApplication) {
  previousAppliation = previousApplication || {}
  const completed = {}
  for (let field in model.children) {
    const {value, started} = model.children[field]
    completed[field] = !empty(started ? value : previousAppliation[field])
  }
  return completed
}

// Extracts the raw values from fields.
// Filters out all fields from an application that haven't been started,
// so that we can do patch updates.
function getFormResponses (model) {
  const fields = {}
  for (let field in model.children) {
    const {value, started} = model.children[field]
    if (started) { // only send through the ones that have actually been updated
      fields[field] = value
    }
  }
  return fields
}
