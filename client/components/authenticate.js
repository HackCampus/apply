const {html} = require('inu')
const u = require('updeep')

const action = (type, payload) => ({type, payload})

const tabs = {
  newApplication: 0,
  existingApplication: 1,
}

module.exports = {
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
  view (model, dispatch) {
    console.log(dispatch('foo'))
    const select = id =>
      dispatch(action('select', id))
    const tab = (id, content) =>
      html`<div class="tab" onclick=${() => select(id)}>- [${id === model.tab ? 'x' : ' '}] ${content}</div>`
    return html`
      <div class="form">
        ${tab(tabs.newApplication, 'Start a new application')}
        ${tab(tabs.existingApplication, 'Edit an existing application')}
        ${(() => {
          switch (model.tab) {
            case tabs.newApplication:
              return 'yep'
            case tabs.existingApplication:
              return 'nope'
          }
        })()}
      </div>
    `
  },
  run () {}
}
