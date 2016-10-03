const {html, pull} = require('inu')
const {Action, Domain} = require('inux')

const view = () => html`
  <div>
    <h1>Apply to HackCampus</h1>
    <div>
      <h2>Step 0: Create an account</h2>
      <p>Already have an account? <p>
    </div>
    <div>
      <h2>Step 1: Tell us your contact details & basic information</h2>
    </div>
    <div>
      <h2>Step 2: Answer a few technical questions</h2>
    </div>
    <div>
      <h2>Step 3: Tell us your tech preferences</h2>
    </div>
  </div>
`

module.exports = Domain({
  name: 'home',
  routes: [
    ['/', () => view()]
  ]
})
