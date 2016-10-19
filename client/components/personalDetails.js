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

const noErrors = {
  errorMessage: null,
  errorFields: {},
}

module.exports = Component({
  children: fields,
  init () {
    return {
      model: noErrors,
      effect: null,
    }
  },
  update (model, {type, payload}) {
    switch (type) {
      case 'save': {
        const user = payload
        const fields = mapValues(model.children, field => field.value)
        if (fields.contactEmail.length === 0) {
          fields.contactEmail = user.email
        }
        return {model: noErrors, effect: action('save', fields)}
      }
      case 'saveUserError': {
        const errors = payload.errors
        const errorFields = {}
        for (let field of errors) {
          errorFields[field] = true
        }
        return {model: {
          errorMessage: 'There were some issues with your responses, please take a look at the ones highlighted in red.',
          errorFields: u.constant(errorFields) // FIXME if we don't add u.constant, fields never get removed because of how updeep works
        }, effect: null}
      }
      case 'saveServerError': {
        const newModel = extend({errorMessage: 'Something is wrong with the server - please let us know at contact@hackcampus.io. Thank you! :)'}, {errorFields: {}})
        return {model: newModel, effect: null}
      }
      case 'saveSuccess': {
        console.log('success')
        return {model: noErrors, effect: null}
      }
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    const errorFields = model.errorFields
    console.log('view', errorFields.gender)
    const isOther = child => model.children[child].value === 'other'
    const other = (fieldName, field) => isOther(fieldName) ? field : ''
    const field = (label, field, comment) =>
      html`<div class="field"><span class=${errorFields[field] ? 'error' : 'no-error'}>${label}:</span> ${children[field]()}${comment ? html`<span class="comment"> // ${comment}</span>` : ''}</div>`
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
          api.put('/me/application/personaldetails', fields),
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
