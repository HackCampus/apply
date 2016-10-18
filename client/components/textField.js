const {html} = require('inu')
const h = html.createElement
const extend = require('xtend')

module.exports = (params = {}) => ({
  init () {
    return {
      model: '',
    }
  },
  update (_, newValue) {
    return {model: newValue}
  },
  view (model, dispatch) {
    return h('div', { style: 'display: inline-block;' }, [
        h('span', extend({
          contenteditable: 'true',
          class: `textfield ${params.class || ''}`,
          oninput: e => dispatch(e.target.textContent),
          style: 'display: inline-block; min-width: 35px',
        }, params), [model])
    ])
  },
})
