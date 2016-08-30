const {html, pull, start} = require('inu')
const {App} = require('inux')
const log = require('inu-log')

const applicationForm = require('./views/applicationForm')
const apply = require('./views/apply')
const home = require('./views/home')

const {navigate} = require('./navigation')

// init

const app = App([
  applicationForm,
  apply,
  home,
  {
    routes: [
      ['notFound', (params, model, dispatch) => html`<h1 onclick=${() => navigate('/apply')}>404!!!!</h1>`],
    ]
  }
])

const {models, views} = start(app)

const page = view => html`
  <div id="container">
    ${view}
  </div>
`

const container = document.createElement('div')
document.body.appendChild(container)

pull(
  views(),
  pull.drain(view => {
    html.update(container, page(view))
  })
)

pull(
  models(),
  pull.drain(model => {
    console.log(model.href)
  })
)
