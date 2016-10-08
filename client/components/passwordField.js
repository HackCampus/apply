const {html} = require('inu')
const jsonSchema = require('jsonschema')
const u = require('updeep')
const extend = require('xtend')

const validatedTextField = require('./validatedTextField')

const defaultSchema = {type: 'string', minLength: 6}
const defaultSize = 3

module.exports = (schema = defaultSchema) => extend(validatedTextField(schema), {
  view (model, dispatch) {
    const valid = model.errors.length > 0 ? 'invalid' : 'valid'
    const length = model.value.length
    return html`
      <div style="display: inline-block;">
        <input
          type="password"
          class="textfield passwordfield ${valid}"
          size=${length > defaultSize ? length : defaultSize}
          oninput=${e => dispatch(e.target.value)}
          value=${model.value}
        />
      </div>
    `
  }
})
