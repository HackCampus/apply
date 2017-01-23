const {html} = require('inu')
const jsonSchema = require('jsonschema')
const u = require('updeep')
const extend = require('xtend')

const validatedTextField = require('./validatedTextField')

const defaultSchema = {type: 'string', minLength: 6}
const defaultSize = 3

module.exports = (schema = defaultSchema) => extend(validatedTextField(schema), {
  view (model, dispatch) {
    const onEnter = model.onEnter
    const confirmValue = model.confirmValue

    const valid = confirmValue
      ? model.valid && model.value === confirmValue
      : model.valid
    const length = model.value.length
    return html`
      <div style="display: inline-block;">
        <input
          type="password"
          class="textfield passwordfield ${valid ? 'valid' : 'invalid'}"
          size=${length > defaultSize ? length : defaultSize}
          oninput=${e => dispatch(e.target.value)}
          onkeydown=${e => { if (e.keyCode === 13) onEnter && onEnter() }}
          value=${model.value}
        />
      </div>
    `
  }
})
