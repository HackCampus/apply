const {html} = require('inu')
const mapValues = require('lodash.mapvalues')

const wireFormats = require('../../wireFormats')

const Component = require('../component')

const choiceField = require('./choiceField')
const selectField = require('./selectField')
const validatedTextField = require('./validatedTextField')

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
  field (label, field, comment) {
    return html`<div class="field">\xA0\xA0\xA0\xA0${label}: ${field}${comment ? html`<span class="comment"> // ${comment}</span>` : ''}</div>`
  },
  view (model, dispatch, children) {
    const isOther = child => model.children[child].value === 'other'
    const other = (fieldName, field) => isOther(fieldName) ? field : ''
    return html`
      <div class="form">
        <h3>Basic information</h3>
        ${this.field('first name', children.firstName())}
        ${this.field('last name', children.lastName())}
        ${this.field('gender', children.gender())}
        ${this.field('date of birth', children.dateOfBirth(), html`<a target="_blank" href="http://www.cl.cam.ac.uk/~mgk25/iso-time.html">YYYY-MM-DD</a>`)}
        <h3>Your studies</h3>
        ${this.field('university', children.university())}
        ${model.children.university.value === fieldSchemas.university.enum[0] ? this.field('specify university', children.otherUniversity()) : ''}
        ${this.field('course name', children.courseName())}
        ${this.field('course type', children.courseType())}
        ${other('courseType', this.field('specify course type', children.otherCourseType()))}
        ${this.field('year of study', children.yearOfStudy())}
        ${other('yearOfStudy', this.field('specify course year', children.otherYearOfStudy()))}
        ${this.field('year of graduation', children.graduationYear())}
        ${other('graduationYear', this.field('specify year of graduation', children.otherGraduationYear()))}
      </div>
    `
  },
})
