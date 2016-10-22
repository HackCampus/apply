const {html} = require('inu')
const h = html.createElement
const jsonSchema = require('jsonschema')
const u = require('updeep')
const extend = require('xtend')

const defaultSchema = {type: 'string', minLength: 1}

module.exports = (schema = defaultSchema, params = {}) => ({
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
      model: {
        errors,
        started: true,
        valid: errors.length == 0,
        value: newValue,
      }
    }
  },
  view (model, dispatch) {
    const {onEnter, started, startingValue} = model
    let {value, valid} = model
    if (!started && startingValue) {
      value = startingValue
      valid = this.validate(value).length === 0
    }

    const validClass = valid ? 'valid' : 'invalid'
    return h('div', { style: 'display: inline-block;' }, [
        h('span', extend({
          contenteditable: 'true',
          class: `textfield ${params.class || ''} ${validClass}`,
          oninput: e => dispatch(e.target.textContent),
          onkeydown: e => { if (e.keyCode === 13) onEnter && onEnter() },
          style: 'display: inline-block; min-width: 35px',
          spellcheck: 'false',
        }, params), [value])
    ])
  },
})
