const {html} = require('inu')

const action = (type, payload) => ({type, payload})

module.exports = {
  init () {
    return {
      model: '',
    }
  },
  update (model, action) {
    return {model: action}
  },
  view (model, dispatch) {
    return html`
      <input type="text" oninput=${e => dispatch(e.target.value)} value=${model} />
    `
  },
}
