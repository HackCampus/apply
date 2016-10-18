const {html} = require('inu')
const u = require('updeep')

module.exports = (options = []) => ({
  init () {
    return {
      model: {
        options,
        selected: -1,
        value: null,
      },
      effect: null,
    }
  },
  update (model, selectedIndex) {
    const selected = selectedIndex - 1 // remove empty choice
    const newModel = u({selected, value: model.options[selected]})
    return {model: newModel, effect: null}
  },
  view (model, dispatch) {
    const {options, selected} = model
    return html`
      <select onchange=${function () { dispatch(this.selectedIndex) }}>
        <option selected=${selected === -1} value="-1"></option>
        ${model.options.map((option, i) => html`
          <option selected=${selected === i} value="${i}">${option}</option>
        `)}
      </select>
    `
  },
})
