const {html} = require('inu')

module.exports = {
  init () {
    return {
      model: '',
    }
  },
  update (_, newValue) {
    return {model: newValue}
  },
  view (model, dispatch) {
    return html`<input type="text" class="textfield" oninput=${e => dispatch(e.target.value)} value=${model} />`
  },
}
