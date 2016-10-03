const {html} = require('inu')

module.exports = {
  init () {
    return {
      model: {},
      effect: null,
    }
  },
  update (model, action) {
    switch (action.type) {
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch) {
    return html`
      yes please children!
    `
  },
  run () {}
}
