const {html} = require('inu')
// const u = require('updeep')

const Component = require('../component')

const link = require('./link')

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
    const {
      completed,
      finished,
      finishApplication,
    } = model
    if (finished) {
      return html`
        <div class="finishApplication">
          <p>That's it! Thanks a lot for taking the time to complete the application.</p>
          <p>We have received your application.</p>
          <p>We will be in touch with you by the end of January latest, letting you know how your application went.</p>
        </div>
      `
    }
    const isCompleted = (() => {
      for (let sectionName in completed) {
        const section = completed[sectionName]
        for (let field in section) {
          if (!section[field]) return false
        }
      }
      return true
    })()
    return isCompleted
      ? html`
        <div class="finishApplication">
          <p>That's it! Thanks a lot for taking the time to complete the application.</p>
          <p>${link('Click here', finishApplication)} to finalise your application.</p>
          <p><strong>You will not be able to edit your application once you have finalised it, so please double-check that everything is correct!</strong></p>
        </div>
      `
      : html`
        <div class="finishApplication">
          <p>Please respond to every question in the application form.</p>
          <p>Once you have done that, you will be able to finish the application in this section.</p>
          <p>The orange bar at the bottom shows you which fields are still missing.</p>
        </div>
      `
  }
})
