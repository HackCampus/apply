const {pull, html} = require('inu')
const values = require('object.values')
const u = require('updeep')

const wireFormats = require('../../../wireFormats')

const action = require('../../lib/action')
const api = require('../../lib/api')
const dateFromNow = require('../../lib/dateFromNow')
const Component = require('../../lib/component')

const filterableApplicationTable = require('../../components/filterableApplicationTable')

const applicationEvents = wireFormats.applicationEvents

const tabs = [
  {
    title: 'news',
    view: function (model, dispatch, children) {
      const {
        events,
      } = model
      return html`<div class="dashboard">
        <h2>Latest matching events</h2>
        ${events
          ? events.map(event => eventView(event))
          : html`<em>Loading events...</em>`}
      </div>`
    },
    effect: action('fetchApplicationEvents'),
  },
  {
    title: 'applications',
    view: function (model, dispatch, children) {
      return children.applications()
    }
  }
]

function eventView (event) {
  const {
    id,
    ts,
    actor,
    applicationId,
    type,
    payload,
  } = event
  return html`<a class="reset" href="/match/application/${applicationId}">
    <div class="event">
      <p><span class="application">application <em>${applicationId /* TODO get actual info */}</em></span> <span class="type">${applicationEvents[type].visibleName}</span> by <span class="actor">${actor.email}</span></p>
      ${(() => {
        const fields = []
        for (let key in payload) {
          const value = payload[key]
          if (key === 'comment') {
            fields.push(html`<pre class="eventcomment">${value}</pre>`)
          } else {
            fields.push(html`<p><span class="eventmetakey">${key}</span>: <span class="eventmetavalue">${value}</span></p>`)
          }
        }
        return fields
      })()}
      <p><span class="ts">${dateFromNow(ts)}</span></p>
    </div>
  </a>`
}

const initialTab = Number.parseInt(window.location.hash.slice(1)) || 0

module.exports = Component({
  children: {
    applications: filterableApplicationTable,
  },
  init () {
    return {
      model: {
        tab: initialTab,
        events: null,
      },
      effect: tabs[initialTab].effect,
    }
  },
  update (model, a) {
    switch (a.type) {
      case 'changeTab': {
        const tab = a.payload
        const customEffect = tabs[tab].effect
        const changeTabEffect = a
        const effect = customEffect ? [changeTabEffect].concat(customEffect) : changeTabEffect
        const newModel = u({tab}, model)
        return {model: newModel, effect}
      }

      case 'fetchApplicationEventsSuccess': {
        const events = a.payload.events
        const newModel = u({events}, model)
        return {model: newModel, effect: null}
      }

      case 'fetchApplicationEventsFailure':
        // TODO
        console.error(a)
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    const {tab} = model
    const currentTab = tabs[tab]
    return html`
      <div class="match">
        <div class="header">
          <h1>HackCampus matching</h1>
        </div>
        <div class="body">
          <div class="menu">
            ${tabs.map(({title}, i) => {
              return html`<div class="menuitem ${i === tab ? 'selected' : 'unselected'}" onclick=${() => dispatch(action('changeTab', i))}>${title}</div>`
            })}
          </div>
          <div class="main">
            ${currentTab.view(model, dispatch, children)}
          </div>
        </div>
      </div>
    `
  },
  run (effect, sources, action) {
    const get = (url, handler) =>
      pull(api.get(url), pull.map(handler))
    switch (effect.type) {
      case 'fetchApplicationEvents': {
        return get('/applications/events', ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('fetchApplicationEventsSuccess', data)
            default: return action('fetchApplicationEventsFailure', data)
          }
        })
      }

      case 'changeTab': {
        const section = effect.payload
        window.location.hash = `#${section}`
        return null
      }
    }
  }
})
