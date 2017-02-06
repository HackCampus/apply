const {pull, html} = require('inu')
const u = require('updeep')

const action = require('../../lib/action')
const Component = require('../../lib/component')

// const someComponent = require('../../components/someComponent')

module.exports = Component({
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
      //   const newModel = ({changeMe: 'please'}, model)
      //   return {model: newModel, effect: null}
      // }
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    return html`
      <div class="manage">
        hello from manage :)
      </div>
    `
  },
  // run (effect, sources, action) {
  //   switch (effect.type) {
  //     case 'foo': {
  //     }
  //   }
  // }
})
