const {pull, html} = require('inu')

const Component = require('../../lib/component')

module.exports = Component({
  children: {},
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
  view (model, dispatch, children) {
    return html`
      <div>hello vetting world!</div>
    `
  },
  run (effect, sources, action) {}
})
