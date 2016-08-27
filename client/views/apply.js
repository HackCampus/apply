const {html} = require('inu')
const {Action, Domain} = require('inux')
const jsonSchema = require('jsonschema')
const updeep = require('updeep')

const fields = require('../fields')

// actions

const actions = {
  input: Symbol('input')
}

const input = Action(actions.input)

// form schema

const requiredString = {type: 'string', minLength: 1}
const optionalString = {anyOf: [{type: 'null'}, {type: 'string'}]}
const optionalEnum = members => ({anyOf: [{enum: members}, {type: 'string'}]}) // useless?
const formSchema = {
  'First name': requiredString,
  'Last name': requiredString,
  'Gender': optionalEnum(['male', 'female']),
  'Date of birth': {type: 'string', format: 'date'},
  'University': optionalEnum(['TODO']),
  'Other university': optionalString,
  'Course': requiredString,
  'Course year': optionalEnum(['1', '2', '3', '4', '5']),
  'Other course year': optionalString,
  'Graduation year': optionalEnum(['2017', '2018', '2019', '2020', '2021']),
  'Other graduation year': optionalString,
}

// returns array of errors
const validate = (label, value) =>
  jsonSchema.validate(value, formSchema[label]).errors


const model = {
  fields: {},
  errors: {},
}

const update = (model, action) => {
  const u = newState => ({model: updeep(newState, model)})
  switch (action.type) {
    case actions.input: {
      const {field, value} = action.payload
      const errors = validate(field, value)
      return u({
        fields: {[field]: value},
        errors: errors.length === 0 ? updeep.omit(field) : {[field]: true}
      }, model)
    }
  }
  return {model}
}

const view = (model, dispatch) => {
  const $ = (field, value) =>
    dispatch(input({field, value}))

  const text = label =>
    fields.labelled(label, model.errors[label], 'text',
      fields.text(model.fields[label], value => $(label, value)))

  const choice = (label, options) =>
    fields.labelled(label, model.errors[label], 'choice',
      fields.choice(model.fields[label], value => $(label, value), options))

  const openChoice = (label, options) =>
    fields.labelled(label, model.errors[label], 'open-choice',
      fields.openChoice(model.fields[label], value => $(label, value), options))

  const date = label =>
    fields.labelled(label, model.errors[label], 'date',
      fields.date(model.fields[label], value => $(label, value)))

  const select = (label, options) =>
    fields.labelled(label, model.errors[label], 'select',
      fields.select(model.fields[label], value => $(label, value), options))

  return html`
    <div class="form">
      <h1>Your profile</h1>
      <h2>Basics</h2>
      ${text('First name')}
      ${text('Last name')}
      ${openChoice('Gender', ['male', 'female', 'other'])}
      ${date('Date of birth')}

      <h2>University</h2>
      <p>If you can't find your university, choose "other" & type in your university.</p>
      ${select('University', ['TODO'])}
      ${fields['University'] === 'other' ? text('Other university') : null}
      ${text('Course')}

      ${openChoice('Course year', ['1', '2', '3', '4', '5'])}
      ${openChoice('Graduation year', ['2017', '2018', '2019', '2020', '2021'])}
    </div>
  `
}

module.exports = Domain({
  name: 'apply',
  init: () => ({model}),
  update,
  routes: [
    ['/apply', (_, model, dispatch) => html`<div>TODO</div>`],
    ['/apply/:hacker', ({hacker}, model, dispatch) => view(model.apply, dispatch)]
  ]
})
