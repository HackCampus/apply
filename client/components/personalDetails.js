const {html} = require('inu')
const mapValues = require('lodash.mapvalues')

const wireFormats = require('../../wireFormats')

const Component = require('../component')

const choiceField = require('./choiceField')
const validatedTextField = require('./validatedTextField')

const fields = mapValues(wireFormats.personalDetails.properties, schema => {
  if (schema.type === 'string') return validatedTextField(schema)
  if (schema.type === 'string' && schema.format === 'date') return validatedTextField(schema) // TODO
  if (schema.enum && schema.enum.length <= 6) return choiceField(schema.enum)
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
    const isOther = child => model.children[child].value === 'other'
    return html`
      <div class="form">
        <h3>Basic information</h3>
        ${this.field('first name', children.firstName())}
        ${this.field('last name', children.lastName())}
        ${this.field('gender', children.gender())}
        ${this.field('date of birth', children.dateOfBirth())}
        <h3>Your studies</h3>
        ${this.field('university', children.university())}
        ${isOther('university') ? this.field('specify university') : ''}
        ${this.field('course name', children.course())}
        ${this.field('course year', children.courseYear())}
        ${isOther('courseYear') ? this.field('specify course year', children.otherCourseYear()) : ''}
        ${this.field('year of graduation', children.graduationYear())}
        ${isOther('graduationYear') ? this.field('specify year of graduation', children.otherCourseYear()) : ''}
      </div>
    `
  },
})
