const {html} = require('inu')
const jsonSchema = require('jsonschema')
const u = require('updeep')

const defaultSchema = {type: 'string', minLength: 1}

module.exports = (schema = defaultSchema) => ({
  validate (value) {
    return jsonSchema.validate(value, schema).errors
  },
  init () {
    return {
      model: {
        errors: [],
        started: false,
        value: '',
      },
    }
  },
  update (model, newValue) {
    const errors = this.validate(newValue)
    return {
      model: u({
        errors,
        started: true,
        valid: errors.length == 0,
        value: newValue,
      })
    }
  },
  view (model, dispatch) {
    const onEnter = model.onEnter

    const valid = model.valid ? 'valid' : 'invalid'
    return html`
      <div style="display: inline-block;">
        <span
          contenteditable="true"
          class="textfield ${valid}"
          oninput=${e => dispatch(e.target.textContent)}
          onkeydown=${e => { if (e.keyCode === 13) onEnter && onEnter() }}
          style="display: inline-block; min-width: 35px"
          spellcheck="false"
        >${model.value}</span>
      </div>
    `
  },
})
