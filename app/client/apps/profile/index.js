const {html, pull, start} = require('inu')
const log = require('inu-log')

const app = require('./app')

function main () {
  const applicationElement = document.getElementById('application')
  const application = JSON.parse(applicationElement.textContent || applicationElement.innerText)
  const {views} = start(app(application))

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
