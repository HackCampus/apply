const {pull, html} = require('inu')
const h = html.createElement
const u = require('updeep')

const action = require('../lib/action')
const Component = require('../lib/component')
const splice = require('../lib/immutableSplice')

const link = require('./link')
const selectField = require('./selectField')

module.exports = options => Component({
  children: {
    select: selectField(options)
  },
  init () {
    return {
      model: {
        active: [],
      },
      effect: null,
    }
  },
  update (model, a) {
    switch (a.type) {
      case 'addFilter': {
        const newValue = model.children.select.value
        const active = model.active.indexOf(newValue) === -1
          ? model.active.concat([newValue])
          : model.active.slice()
        const children = {
          select: this.children.select.init().model // reset
        }
        const newModel = u({active, children}, model)
        return {model: newModel, effect: null}
      }
      case 'removeFilter': {
        const i = a.payload
        const active = splice(model.active, i, 1)
        const newModel = u({active}, model)
        return {model: newModel, effect: null}
      }
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    return h('div', {class: 'filter'}, [
      model.active.map((item, i) => h('div', {class: 'filterItem'}, [item, ' ', link('-', () => dispatch(action('removeFilter', i))), ' '])),
      children.select(),
      ' ',
      link('+', () => dispatch(action('addFilter'))),
    ])
  },
  getActive (model) {
    // If we only look at model.active, any selected item in the select box
    // won't actually be active, which is confusing.
    let active = model.active
    const currentlySelected = model.children.select.value
    if (model.children.select.value !== null) {
      active = active.concat([currentlySelected])
    }
    return active
  },
})
