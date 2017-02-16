const {pull, html} = require('inu')
const u = require('updeep')

const action = require('../../lib/action')
// const api = require('../../lib/api')
const Component = require('../../lib/component')

// const someComponent = require('../../components/someComponent')

module.exports = application => Component({
  children: {
    // TODO add children...
  },
  init () {
    return {
      model: {},
      effect: null,
    }
  },
  update (model, action) {
    switch (action.type) {
      // case 'changeMe': {
      //   const newModel = u({changeMe: 'please'}, model)
      //   return {model: newModel, effect: null}
      // }
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    return html`
      <div class="profile">
        ${application.firstName} ${application.lastName}
      </div>
    `
  },
  // run (effect, sources, action) {
  //   const get = (url, handler) =>
  //     pull(api.get(url), pull.map(handler))
  //   switch (effect.type) {
  //     case 'foo': {
  //     }
  //   }
  // }
})
