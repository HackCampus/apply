const {html, pull, start} = require('inu')
const log = require('inu-log')

const app = require('./app')

function main () {
  const {actions, views, models} = start(app)

  const container = document.getElementById('container')
  const appDiv = container.appendChild(document.createElement('div'))
  pull(
    views(),
    pull.drain(view => {
      html.update(appDiv, view)
    })
  )

  // pull(
  //   actions(),
  //   pull.log()
  // )

  // pull(
  //   models(),
  //   pull.log()
  // )
}
document.addEventListener('DOMContentLoaded', main)
