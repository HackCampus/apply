const {html} = require('inu')
const u = require('updeep')

const Component = require('../component')

const newApplication = require('./newApplication')

const action = (type, payload) => ({type, payload})

const tabs = {
  newApplication: 0,
  existingApplication: 1,
}

module.exports = Component({
  children: {
    newApplication,
  },
  init () {
    return {
      model: {
        tab: tabs.newApplication,
      },
      effect: null,
    }
  },
  update (model, action) {
    switch (action.type) {
      case 'select': {
        const newModel = u({tab: action.payload}, model)
        return {model: newModel, effect: null}
      }
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    const select = id =>
      dispatch(action('select', id))
    const radio = (id, content) =>
      html`<div class="tab" onclick=${() => select(id)}>- [${id === model.tab ? 'x' : ' '}] <span class="tab-content">${content}</span></div>`
    return html`
      <div class="form">
        ${radio(tabs.newApplication, 'Start a new application')}
        ${radio(tabs.existingApplication, 'Edit an existing application')}
        ${(() => {
          switch (model.tab) {
            case tabs.newApplication:
              return children.newApplication()
            case tabs.existingApplication:
              return 'nope'
          }
        })()}
      </div>
    `
  }
})
