const {html} = require('inu')

const Component = require('../component')

const textField = require('./textField')

module.exports = Component({
  children: {
    email: textField,
    username: textField,
  },
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
    return html`
      <div>
        <p>\xA0\xA0\xA0\xA0email: ${children.email()}</p>
        <p>\xA0\xA0\xA0\xA0username: hackcampus.io/~${children.username()}</p>
      </div>
    `
  },
})
