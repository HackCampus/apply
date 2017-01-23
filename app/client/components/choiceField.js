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
        started: false,
        choices,
      },
      effect: null,
    }
  },
  update (model, chosen) {
    const newModel = u({chosen, value: model.choices[chosen], started: true}, model)
    return {model: newModel, effect: null}
  },
  view (model, dispatch) {
    const {choices, started, startingValue} = model
    let chosen = model.chosen
    if (!started && startingValue != null) {
      chosen = choices.indexOf(startingValue)
    }
    return html`
      ${intersperse(' | ', choices.map((choice, i) => link(choice, () => dispatch(i), {
        class: `choice ${i === chosen ? 'chosen' : ''}`
      })))}
    `
  },
})
