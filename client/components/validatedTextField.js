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
        value: '',
        errors: [],
        started: false,
      },
    }
  },
  update (model, newValue) {
    return {
      model: u({
        value: newValue,
        errors: this.validate(newValue),
        started: true
      })
    }
  },
  view (model, dispatch) {
    const valid = model.errors.length > 0 ? 'invalid' : 'valid'
    return html`<input type="text" class="textfield ${valid}" oninput=${e => dispatch(e.target.value)} value=${model.value} />`
  },
})
