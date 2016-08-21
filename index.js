const classes = require('classnames')
const {start, html, pull} = require('inu')
const log = require('inu-log')
const jsonSchema = require('jsonschema')
const intersperse = require('ramda/src/intersperse')
const updeep = require('updeep')

// form schema

const formSchema = {
  'First name': {type: 'string', minLength: 1},
  'Last name': {type: 'string', minLength: 1},
  'Gender': {enum: ['male', 'female', 'other']},
  'Date of birth': {type: 'string', format: 'date'},
  'University': {enum: ['TODO', 'foo', 'bar']},
  'Course': {type: 'string', minLength: 1},
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
  fields: {
    'First name': null,
    'Last name': null,
    'Gender': null,
    'Date of birth': null,
  },
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
  const dispatchInput = (field, value) =>
    dispatch(actions.input({field, value}))

  const text = label =>
    textField(label, model.fields[label], model.errors[label], value => dispatchInput(label, value))

  const choice = (label, options) =>
    choiceField(label, options, model.fields[label], model.errors[label], value => dispatchInput(label, value))

  const date = label =>
    dateField(label, model.fields[label], model.errors[label], value => dispatchInput(label, value))

  const select = (label, options) =>
    selectField(label, options, model.fields[label], model.errors[label], value => dispatchInput(label, value))

  return html`
    <div class="form">
      <h1>Your profile</h1>
      ${text('First name')}
      ${text('Last name')}
      ${choice('Gender', ['male', 'female', 'other'])}
      ${date('Date of birth')}
      ${select('University', ['TODO', 'foo', 'bazzz'])}
      ${text('Course')}
    </div>
  `
}

const textField = (label, value, error, onValue) =>
  html`
    <div class="${classes('field', 'text', {error})}">
      <label>${label}: <input type="text" oninput=${e => onValue(e.target.value)} value=${value || ''} /></label>
    </div>
  `

const choiceField = (label, options, value, error, onValue) =>
  html`
    <div class="${classes('field', 'choice', {error})}">
      ${label}:
      ${intersperse(' / ', options.map(option => html`
        <span
          class="option ${option === value ? 'selected' : ''}"
          onclick=${() => onValue(option)}
          tabindex=0
          onkeydown=${e => {if (e.keyCode === 13) onValue(option)}}
        >
          ${option}
        </span>
      `))}
    </div>
  `

const dateField = (label, value, error, onValue) =>
  html`
    <div class="${classes('field', 'date', {error})}">
      <label>${label}: <input type="text" oninput=${e => onValue(e.target.value)} value=${value || ''} placeholder="YYYY-MM-DD" /></label>
    </div>
  `

const selectField = (label, options, value, error, onValue) =>
  html`
    <div class="${classes('field', 'select', {error})}">
      ${label}:
      <select onchange=${e => onValue(options[e.target.selectedIndex])}>
        ${options.map(option => html`<option ${option === value ? 'selected' : ''}>${option}</option>`)}
      </select>
    </div>
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
