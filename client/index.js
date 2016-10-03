const {html, pull, start} = require('inu')
const log = require('inu-log')
const mapValues = require('lodash.mapvalues')
const u = require('updeep')

const action = (type, payload) => ({type, payload})

const Component = require('./component')

const authenticate = require('./components/authenticate')

const app = Component({
  children: {
    authenticate,
  },
  init () {
    return {
      model: {
        expanded: {
          step0: true,
          step1: false,
        },
        heights: {
          step0: 'auto',
          step1: 0,
        },
      },
      effect: null,
    }
  },
  update (model, action) {
    switch (action.type) {
      case 'toggleExpanded': {
        const name = action.payload
        const model_ = u.updateIn(['expanded', name], expanded => !expanded, model)
        const isExpanded = model_.expanded[name]
        const element = document.querySelector(`.expando-${name}`)
        const height = isExpanded ? `${element.scrollHeight}px` : '0'
        const newModel = u.updateIn(['heights', name], height, model_)
        return {model: newModel, effect: null}
      }
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    const section = (name, header, content) => html`
      <div class="${name}">
        <h2 onclick=${() => dispatch(action('toggleExpanded', name))}>${header}</h2>
        <div class="expando expando-${name}" style="height: ${model.heights[name]}">
          ${content}
        </div>
      </div>
    `
    return html`
      <div>
        <h1>Apply to HackCampus</h1>
        ${section('step0', 'Step 0: Authenticate', children.authenticate())}
      </div>
    `
  }
})

const {views} = start(app)

const container = document.getElementById('container')
const appDiv = container.appendChild(document.createElement('div'))
pull(
  views(),
  pull.drain(view => {
    html.update(appDiv, view)
  })
)
