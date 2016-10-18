const {html} = require('inu')
const mapValues = require('lodash.mapvalues')

const wireFormats = require('../../wireFormats')

const Component = require('../component')

const choiceField = require('./choiceField')
const validatedTextField = require('./validatedTextField')

const fields = mapValues(wireFormats.contactDetails.properties, schema => {
  if (schema.type === 'string') return validatedTextField(schema)
  if (schema.type === 'string' && schema.format === 'date') return validatedTextField(schema) // TODO
  if (schema.enum && schema.enum.length < 6) return choiceField(schema.enum)
  console.error(schema)
  return validatedTextField() // TODO
})

module.exports = Component({
  children: fields,
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
  field (label, field) {
    return html`<div class="field">\xA0\xA0\xA0\xA0${label}: ${field}</div>`
  },
  view (model, dispatch, children) {
    return html`
      <div class="form">
        ${this.field('first name', children.firstName())}
        ${this.field('last name', children.lastName())}
        ${this.field('gender', children.gender())}
        ${this.field('date of birth', children.dateOfBirth())}
        ${this.field('university', children.university())}
        ${this.field('course', children.course())}
        ${this.field('courseYear', children.courseYear())}
        ${this.field('graduationYear', children.graduationYear())}
      </div>
    `
  },
})
