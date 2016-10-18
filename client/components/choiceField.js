const {html} = require('inu')
const intersperse = require('ramda/src/intersperse')
const u = require('updeep')

module.exports = (choices = []) => ({
  init () {
    return {
      model: {
        chosen: -1,
        choices,
      },
      effect: null,
    }
  },
  update (model, chosen) {
    const newModel = u({chosen}, model)
    return {model: newModel, effect: null}
  },
  view (model, dispatch) {
    const {chosen, choices} = model
    return html`
      ${intersperse(' / ', choices.map((choice, i) => html`
        <a href="#" class="choice ${i === chosen ? 'chosen' : ''}" onclick=${() => dispatch(i)}>${choice}</a>
      `))}
    `
  },
})
