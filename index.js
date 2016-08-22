const classes = require('classnames')
const {start, html, pull} = require('inu')
const log = require('inu-log')
const jsonSchema = require('jsonschema')
const intersperse = require('ramda/src/intersperse')
const updeep = require('updeep')

const year = 2017

function contains (array, item) {
  return array.indexOf(item) !== -1
}

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

// app

const createAction = type => payload => ({type, payload})

const actions = {
  input: createAction('input'),
}

const model = {
  fields: {}, // TODO
  errors: {},
}

const update = (model, action) => {
  const u = newState => ({model: updeep(newState, model)})
  switch (action.type) {
    case 'input': {
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
  const {errors, fields} = model

  const dispatchInput = (field, value) =>
    dispatch(actions.input({field, value}))

  const text = label =>
    labelledField(label, model.errors[label], 'text',
      textField(fields[label], value => dispatchInput(label, value)))

  const choice = (label, options) =>
    labelledField(label, errors[label], 'choice',
      choiceField(fields[label], value => dispatchInput(label, value), options))

  const openChoice = (label, options) =>
    labelledField(label, errors[label], 'open-choice',
      openChoiceField(fields[label], value => dispatchInput(label, value), options))

  const date = label =>
    labelledField(label, errors[label], 'date',
      dateField(fields[label], value => dispatchInput(label, value)))

  const select = (label, options) =>
    labelledField(label, errors[label], 'select',
      selectField(fields[label], value => dispatchInput(label, value), options))

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

const labelledField = (label, error, type, field) =>
  html`
    <div class="${classes('field', type, {error})}">
      ${label}: ${field}
    </div>
  `

const textField = (value, onInput) =>
  html`<input type="text" oninput=${e => onInput(e.target.value)} value=${value || ''} />`

const choiceField = (value, onInput, options) =>
  html`
    <span>
      ${intersperse(' / ', options.map(option => html`
        <span
          class="option ${option === value ? 'selected' : ''}"
          onclick=${() => onInput(option)}
          tabindex=0
          onkeydown=${e => {if (e.keyCode === 13) onInput(option)}}
        >
          ${option}
        </span>
      `))}
    </span>
  `

const openChoiceField = (value, onInput, options) =>
  html`
    <span>
      ${choiceField(value, onInput, options.concat('other'))}
      ${value && !contains(options, value) || value === 'other'
        ? textField(value === 'other' ? '' : value, onInput)
        : null}
    </span>
  `

const dateField = (value, onInput) =>
  html`<input type="text" oninput=${e => onInput(e.target.value)} value=${value || ''} placeholder="YYYY-MM-DD" />`

const selectField = (value, onInput, options) =>
  html`
    <select onchange=${e => onInput(options[e.target.selectedIndex])}>
      ${options.map(option => html`<option ${option === value ? 'selected' : ''}>${option}</option>`)}
    </select>
  `

// init

const app = {
  init: () => ({ model }),
  update,
  view,
}

const container = document.createElement('div')
document.body.appendChild(container)

const {models, views} = start(log(app))

pull(
  views(),
  pull.drain(view => {
    html.update(container, view)
  })
)

pull(models(), pull.drain(model => {
  console.log(model.errors)
}))
