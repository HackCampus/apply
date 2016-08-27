const {html, pull, start} = require('inu')
const {App} = require('inux')
const log = require('inu-log')

const apply = require('./views/apply')

// TODO
const year = 2017

// init

const container = document.createElement('div')
document.body.appendChild(container)

const app = App([
  apply,
  {
    routes: [['/', (params, model, dispatch) => html`<h1>yeee</h1>`]]
  }
])

const {models, views} = start(app)

pull(
  views(),
  pull.drain(view => {
    html.update(container, view)
  })
)
