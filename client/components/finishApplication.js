const {html} = require('inu')
// const u = require('updeep')

const Component = require('../component')

const link = require('./link')

module.exports = Component({
  children: {},
  init () {
    return {
      model: {
        // saveApplication: from parent
      },
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
    const {
      saveApplication,
    } = model
    return html`
      <div class="finishApplication">
        <p>That's it! ${link('Click here', saveApplication)} to finish your application.</p>
      </div>
    `
  },
  run (effect, sources, action) {}
})
