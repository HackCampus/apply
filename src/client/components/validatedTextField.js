const {html} = require('inu')
const h = html.createElement
const u = require('updeep')
const extend = require('xtend')

const validate = require('../../lib/validate')

const defaultSchema = {type: 'string', minLength: 1}
const defaultSize = 3

module.exports = (schema = defaultSchema, params = {}) => ({
  validate (value) {
    return validate(value, schema)
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

    const length = model.value.length
    const validClass = valid ? 'valid' : 'invalid'
    return h('div', { style: 'display: inline-block;' }, [
        h('input', extend({
          type: 'text',
          size: length > defaultSize ? length : defaultSize,
          class: `textfield ${params.class || ''} ${validClass}`,
          oninput: e => dispatch(e.target.value),
          onkeydown: e => { if (e.keyCode === 13) onEnter && onEnter() },
          spellcheck: 'false',
          value: value,
        }, params))
    ])
  },
})
