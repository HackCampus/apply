const classes = require('classnames')
const {html} = require('inu')
const intersperse = require('ramda/src/intersperse')

const labelled = (label, error, type, field) =>
  html`
    <div class="${classes('field', type, {error})}">
      ${label}: ${field}
    </div>
  `

const text = (value, onInput) =>
  html`<input type="text" oninput=${e => onInput(e.target.value)} value=${value || ''} />`

const choice = (value, onInput, options) =>
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

const openChoice = (value, onInput, options) =>
  html`
    <span>
      ${choice(value, onInput, options.concat('other'))}
      ${value && !contains(options, value) || value === 'other'
        ? text(value === 'other' ? '' : value, onInput)
        : null}
    </span>
  `

const date = (value, onInput) =>
  html`<input type="text" oninput=${e => onInput(e.target.value)} value=${value || ''} placeholder="YYYY-MM-DD" />`

const select = (value, onInput, options) =>
  html`
    <select onchange=${e => onInput(options[e.target.selectedIndex])}>
      ${options.map(option => html`<option ${option === value ? 'selected' : ''}>${option}</option>`)}
    </select>
  `


const contains = (array, item) =>
  array.indexOf(item) !== -1

module.exports = {
  labelled,
  text,
  choice,
  openChoice,
  date,
  select,
}
