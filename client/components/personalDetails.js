const {html, pull} = require('inu')
const isEmpty = require('lodash.isempty')
const mapValues = require('lodash.mapvalues')
const u = require('updeep')
const extend = require('xtend')

const wireFormats = require('../../wireFormats')

const api = require('../api')
const Component = require('../component')

const choiceField = require('./choiceField')
const link = require('./link')
const selectField = require('./selectField')
const validatedTextField = require('./validatedTextField')

const action = (type, payload) => ({type, payload})

const fieldSchemas = wireFormats.personalDetails.properties
const fields = mapValues(fieldSchemas, schema => {
  if (schema.type === 'string') return validatedTextField(schema)
  if (schema.enum) {
    if (schema.enum.length <= 6) {
      return choiceField(schema.enum)
    } else {
      return selectField(schema.enum)
    }
  }
  // unknown field type
  console.error(schema)
  return validatedTextField(schema)
})

module.exports = Component({
  children: fields,
  init () {
    return {
      model: {
        errorMessage: null,
        errorFields: {},
        readOnly: false,
      },
      effect: null,
    }
  },
  update (model, {type, payload}) {
    switch (type) {
      case 'save': {
        const user = payload
        const fields = {}
        for (let field in model.children) {
          const {value, started} = model.children[field]
          if (started) { // only send through the ones that have actually been updated
            fields[field] = value
          }
        }
        if (fields.contactEmail && fields.contactEmail.length === 0) {
          fields.contactEmail = user.email
        }
        const newModel = u({
          errorMessage: null,
          errorFields: u.constant({}), // FIXME if we don't add u.constant, fields never get removed because of how updeep works
          readOnly: true,
        }, model)
        return {model: newModel, effect: action('save', fields)}
      }
      case 'saveUserError': {
        const errors = payload.errors
        const errorFields = {}
        for (let field of errors) {
          errorFields[field] = true
        }
        const newModel = u({
          errorMessage: 'There were some issues with your responses, please take a look at the ones highlighted in red.',
          errorFields: u.constant(errorFields), // FIXME if we don't add u.constant, fields never get removed because of how updeep works
          readOnly: false,
        }, model)
        return {model: newModel, effect: null}
      }
      case 'saveServerError': {
        const newModel = u({
          errorMessage: 'Something is wrong with the server - please let us know at contact@hackcampus.io. Thank you! :)',
          errorFields: u.constant({}), // FIXME if we don't add u.constant, fields never get removed because of how updeep works
          readOnly: false,
        }, model)
        return {model: newModel, effect: null}
      }
      case 'saveSuccess': {
        const newModel = u({
          errorMessage: null,
          errorFields: u.constant({}), // FIXME if we don't add u.constant, fields never get removed because of how updeep works
          readOnly: false,
        }, model)
        return {model: newModel, effect: null}
      }
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    const {
      application, // fetched from the server
      errorFields,
      readOnly,
      user,
    } = model
    const isOther = child => model.children[child].value === 'other'
    const other = (fieldName, field) => isOther(fieldName) ? field : ''
    const field = function (label, field, comment) {
      const labelClass = errorFields[field] ? 'error' : 'no-error'
      const commentElement = comment
        ? html`<span class="comment"> // ${comment}</span>`
        : ''
      let fieldElement
      if (readOnly) {
        const childModel = model.children[field]
        if (childModel.started) {
          fieldElement = childModel.value
        } else if (application) {
          fieldElement = application[field]
        } else {
          fieldElement = ''
        }
      } else {
        const childView = children[field]
        if (application) {
          fieldElement = childView({startingValue: application[field]})
        } else {
          fieldElement = childView()
        }
      }
      return html`<div class="field"><span class=${labelClass}>${label}:</span> ${fieldElement}${commentElement}</div>`
    }
    return html`
      <div class="form">
        <h3>Basic information</h3>
        ${field('first name', 'firstName')}
        ${field('last name', 'lastName')}
        ${field('contact email', 'contactEmail', 'optional - if different from registration email')}
        ${field('gender', 'gender')}
        ${field('date of birth', 'dateOfBirth', html`<a target="_blank" href="http://www.cl.cam.ac.uk/~mgk25/iso-time.html">YYYY-MM-DD</a>`)}
        <h3>Your studies</h3>
        ${field('university', 'university')}
        ${model.children.university.value === fieldSchemas.university.enum[0] ? field('specify university', 'otherUniversity') : ''}
        ${field('course name', 'courseName')}
        ${field('course type', 'courseType')}
        ${other('courseType', field('specify course type', 'otherCourseType'))}
        ${field('year of study', 'yearOfStudy')}
        ${other('yearOfStudy', field('specify course year', 'otherYearOfStudy'))}
        ${field('year of graduation', 'graduationYear')}
        ${other('graduationYear', field('specify year of graduation', 'otherGraduationYear'))}
        ${link('Save', () => dispatch(action('save', model.user)))}
        ${model.errorMessage ? html`<div class="error">${model.errorMessage}</div>` : ''}
      </div>
    `
  },
  run (effect, sources, action) {
    switch (effect.type) {
      case 'save': {
        const fields = effect.payload
        return pull(
          api.put('/me/application', fields),
          pull.map(({statusText, data}) => {
            switch (statusText) {
              case 'OK': return action('saveSuccess')
              case 'Bad Request': return action('saveUserError', data)
              default: return action('saveServerError', data)
            }
          })
        )
      }
    }
  }
})
