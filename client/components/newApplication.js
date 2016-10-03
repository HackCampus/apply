const {html} = require('inu')

const Component = require('../component')

const textField = require('./textField')
const validatedTextField = require('./validatedTextField')

module.exports = Component({
  children: {
    email: validatedTextField({"format": "email"}),
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
        <div>\xA0\xA0\xA0\xA0email: ${children.email()}</div>
        <div>\xA0\xA0\xA0\xA0username: hackcampus.io/~${children.username()}</div>
      </div>
    `
  },
})
