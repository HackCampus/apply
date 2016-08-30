const {html, pull} = require('inu')
const {Action, Domain} = require('inux')

const view = () => html`
  <a href="/apply">apply</a>
`

module.exports = Domain({
  name: 'home',
  routes: [
    ['/', () => view()]
  ]
})
