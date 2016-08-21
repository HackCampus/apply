const {start, html, pull} = require('inu')
const log = require('inu-log')
const jsonSchema = require('jsonschema')
const intersperse = require('ramda/src/intersperse')
const updeep = require('updeep')

// Form schema

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

// App

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
    textField(label, model.fields[label], value => dispatchInput(label, value))

  const choice = (label, options) =>
    choiceField(label, options, model.fields[label], value => dispatchInput(label, value))

  const date = label =>
    dateField(label, model.fields[label], value => dispatchInput(label, value))

  return html`
    <div class="form">
      <h1>Your profile</h1>
      ${text('First name')}
      ${text('Last name')}
      ${choice('Gender', ['male', 'female', 'other'])}
      ${date('Date of birth')}
      ${text('Course')}
    </div>
  `
}

const textField = (label, value, onValue) =>
  html`
    <div class="field text">
      <label>${label}: <input type="text" oninput=${e => onValue(e.target.value)} value=${value || ''} /></label>
    </div>
  `

const choiceField = (label, options, value, onValue) =>
  html`
    <div class="field choice">
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

const dateField = (label, value, onValue) =>
  html`
    <div class="field date">
      <label>${label}: <input type="text" oninput=${e => onValue(e.target.value)} value=${value || ''} placeholder="YYYY-MM-DD" /></label>
    </div>
  `

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
