const {html} = require('inu')
const extend = require('xtend')

module.exports = (params = {}) => {
  init () {
    return {
      model: '',
    }
  },
  update (_, newValue) {
    return {model: newValue}
  },
  view (model, dispatch) {
    return html.createElement('input', extend(params, {
      type: 'text',
      oninput: e => dispatch(e.target.value),
      value: model,
    })
  },
}
