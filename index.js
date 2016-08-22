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
  const dispatchInput = (field, value) =>
    dispatch(actions.input({field, value}))

  const text = label =>
    labelledField(label, model.errors[label], 'text',
      textField(model.fields[label], value => dispatchInput(label, value)))

  const choice = (label, options) =>
    labelledField(label, model.errors[label], 'choice',
      choiceField(model.fields[label], value => dispatchInput(label, value), options))

  const date = label =>
    labelledField(label, model.errors[label], 'date',
      dateField(model.fields[label], value => dispatchInput(label, value)))

  const select = (label, options) =>
    labelledField(label, model.errors[label], 'select',
      selectField(model.fields[label], value => dispatchInput(label, value), options))

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
