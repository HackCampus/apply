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

const personalDetails = Component({
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
      return html`<div class="field"><span class=${labelClass}>${label}:</span> ${commentElement}<br />\xA0\xA0${fieldElement}</div>`
    }
    return html`
      <div class="form">
        <h3>Basic information</h3>
        ${field('first name', 'firstName')}
        ${field('last name', 'lastName')}
        ${field('contact email', 'contactEmail', 'optional - only needed if different from your registration email')}
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
        <h3>Links</h3>
        <p>Please make sure your CV is publicly accessible and is up to date. Not having a working CV link will greatly reduce your chances of being accepted in the programme.</p>
        ${field('link to your CV', 'cvUrl')}
        ${field('website', 'websiteUrl', 'optional')}
        ${field('LinkedIn', 'linkedinUrl', 'optional')}
        ${model.errorMessage ? html`<div class="error">${model.errorMessage}</div>` : ''}
      </div>
    `
  },
})

personalDetails.getFormResponses = function (model) {
  const fields = {}
  for (let field in model.children) {
    const {value, started} = model.children[field]
    if (started) { // only send through the ones that have actually been updated
      fields[field] = value
    }
  }
  return fields
}

module.exports = personalDetails
