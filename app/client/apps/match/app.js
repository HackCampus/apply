const {pull, html} = require('inu')
const u = require('updeep')

const action = require('../../lib/action')
const api = require('../../lib/api')
const dateFromNow = require('../../lib/dateFromNow')
const Component = require('../../lib/component')

const applicationTable = require('../../components/applicationTable')

const tabs = [
  {
    title: 'dashboard',
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
    title: 'unfinished',
    view: function (model, dispatch, children) {
      return html`<div class="unfinished">
        <h2>Unfinished applications</h2>
        ${children.unfinishedApplications
          ? children.unfinishedApplications()
          : html`<em>Loading...</em>`}
      </div>`
    },
    effect: action('fetchUnfinishedApplications'),
  },
  {
    title: 'finished — ready to vet',
    view: function (model, dispatch, children) {
      return html`<div class="finished">
        <h2>Finished applications</h2>
        ${children.finishedApplications
          ? children.finishedApplications()
          : html`<em>Loading...</em>`}
      </div>`
    },
    effect: action('fetchFinishedApplications'),
  },
  {
    title: 'vetted',
    view: function (model, dispatch, children) {
      return html`<p>none vetted</p>`
    }
  },
  {
    title: 'ready to match',
    view: function (model, dispatch, children) {
      return html`<p>none ready</p>`
    }
  },
  {
    title: 'matching',
    view: function (model, dispatch, children) {
      return html`<p>none matching</p>`
    },
  },
  {
    title: 'done',
    view: function (model, dispatch, children) {
      return html`<p>none done</p>`
    },
  },
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
  return html`<a class="reset" href="/match/application/${applicationId}" target="_blank">
    <div class="event">
      <p><span class="type">${type}</span> <span class="application">application <em>${applicationId /* TODO get actual info */}</em></span> by <span class="actor">${actor.email}</span></p>
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

module.exports = Component({
  children: {}, // will be added dynamically
  init () {
    return {
      model: {
        tab: 0,
        events: null,
        unfinishedApplications: null,
      },
      effect: action('fetchApplicationEvents'),
    }
  },
  update (model, a) {
    switch (a.type) {
      case 'changeTab': {
        const tab = a.payload
        const effect = tabs[tab].effect
        const newModel = u({tab}, model)
        return {model: newModel, effect}
      }

      case 'fetchApplicationEventsSuccess': {
        const events = a.payload.events
        const newModel = u({events}, model)
        return {model: newModel, effect: null}
      }

      case 'fetchUnfinishedApplicationsSuccess': {
        const unfinishedApplications = a.payload.applications
        const newModel = u({unfinishedApplications}, model)
        return {model: newModel, effect: action('replaceChild', {
          key: 'unfinishedApplications',
          newChild: () => applicationTable(unfinishedApplications, ['finishedAt', 'status'])
        })}
      }
      case 'fetchFinishedApplicationsSuccess': {
        const finishedApplications = a.payload.applications
        const newModel = u({finishedApplications}, model)
        return {model: newModel, effect: action('replaceChild', {
          key: 'finishedApplications',
          newChild: () => applicationTable(finishedApplications, ['status'])
        })}
      }

      case 'fetchApplicationEventsFailure':
      case 'fetchUnfinishedApplicationsFailure':
      case 'fetchFinishedApplicationsFailure':
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
          <div class="sidebar">
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
      case 'fetchUnfinishedApplications': {
        return get('/applications/unfinished', ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('fetchUnfinishedApplicationsSuccess', data)
            default: return action('fetchUnfinishedApplicationsFailure', data)
          }
        })
      }
      case 'fetchFinishedApplications': {
        return get('/applications/finished', ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('fetchFinishedApplicationsSuccess', data)
            default: return action('fetchFinishedApplicationsFailure', data)
          }
        })
      }

      case 'replaceChild': {
        const {key, newChild} = effect.payload
        this.replaceChild(key, newChild())
        return pull.once(action('doNothing'))
      }
    }
  }
})
