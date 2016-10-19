const {html} = require('inu')
const intersperse = require('ramda/src/intersperse')
const u = require('updeep')

const link = require('./link')

module.exports = (choices = []) => ({
  init () {
    return {
      model: {
        chosen: -1,
        value: null,
        choices,
      },
      effect: null,
    }
  },
  update (model, chosen) {
    const newModel = u({chosen, value: model.choices[chosen]}, model)
    return {model: newModel, effect: null}
  },
  view (model, dispatch) {
    const {chosen, choices} = model
    return html`
      ${intersperse(' | ', choices.map((choice, i) => link(choice, () => dispatch(i), {
        class: `choice ${i === chosen ? 'chosen' : ''}`
      })))}
    `
  },
})
