const {pull, html} = require('inu')
const moment = require('moment')
const u = require('updeep')

const wireFormats = require('../../../wireFormats')

const action = require('../../lib/action')
const api = require('../../lib/api')
const Component = require('../../lib/component')

const selectField = require('../../components/selectField')
const textArea = require('../../components/textArea')
const applicationView = require('../../components/applicationView')

const possibleActions = wireFormats.applicationEvent.properties.type.enum

// TODO hacky
const applicationId = window.location.pathname.match(/application\/([^/]+)/)[1]

function dateFromNow (date) {
  return html`<span title=${date}>${moment(date).fromNow()}</span>`
}

function eventView (event) {
  const {
    ts,
    actor,
    type,
    payload,
  } = event
  return html`<div class="event">
    <p><span class="type">${type}</span> by <span class="actor">${actor.email}</span></p>
    ${(() => {
      const fields = []
      for (let key in payload) {
        const value = payload[key]
        if (key === 'comment') {
          fields.push(html`<p><span class="eventcomment">${value}</span></p>`)
        } else {
          fields.push(html`<p><span class="eventmetakey">${key}</span>: <span class="eventmetavalue">${value}</span></p>`)
        }
      }
      return fields
    })()}
    <p><span class="ts">${dateFromNow(ts)}</span></p>
  </div>`
}

module.exports = Component({
  children: {
    actionType: selectField(possibleActions),
    comment: textArea('add a comment...'),
  },
  init () {
    return {
      model: {
        application: null,
        events: null,
      },
      effect: [action('fetchApplication'), action('fetchApplicationEvents')],
    }
  },
  update (model, a) {
    switch (a.type) {
      case 'fetchApplicationSuccess': {
        const newModel = u({application: a.payload}, model)
        return {model: newModel, effect: null}
      }
      case 'fetchApplicationEventsSuccess': {
        const events = a.payload.events.reverse()
        const newModel = u({events}, model)
        return {model: newModel, effect: null}
      }

      case 'submit': {
        const event = {
          type: model.children.actionType.value || 'commented',
          payload: {
            comment: model.children.comment.value,
          }
        }
        return {model, effect: action('submit', event)}
      }
      case 'submitSuccess': {
        const events = a.payload.events.reverse()
        const newModel = u({events}, model)
        return {model: newModel, effect: null}
      }

      case 'fetchApplicationFailure':
      case 'fetchApplicationEventsFailure':
      case 'submitFailure':
        // TODO
        console.error(a)
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    const {
      application,
    } = model
    if (application == null) {
      return html``
    }
    return html`
      <div class="matchDetail">
        <div class="applicationview">
          <h2>Application</h2>
          ${applicationView(application)}
        </div>
        ${this.actionsView(model, dispatch, children)}
      </div>
    `
  },
  actionsView (model, dispatch, children) {
    const {
      application,
      events,
    } = model

    return html`
      <div class="actions">
        <h2>Events</h2>
        <p>action: ${children.actionType()}</p>
        ${children.comment()}
        <a onclick=${() => dispatch(action('submit'))}>Submit</a>
        <div class="events">
          ${events
            ? events.map(event => eventView(event))
            : ''}
        </div>
      </div>
    `
  },
  run (effect, sources, action) {
    const get = (url, handler) =>
      pull(api.get(url), pull.map(handler))
    const post = (url, body, handler) =>
      pull(api.post(url, body), pull.map(handler))
    switch (effect.type) {
      case 'fetchApplication': {
        return get(`/applications/${applicationId}`, ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('fetchApplicationSuccess', data)
            default: return action('fetchApplicationFailure', data)
          }
        })
      }

      case 'fetchApplicationEvents': {
        return get(`/applications/${applicationId}/events`, ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('fetchApplicationEventsSuccess', data)
            default: return action('fetchApplicationEventsFailure', data)
          }
        })
      }

      case 'submit': {
        const event = effect.payload
        return post(`/applications/${applicationId}/events`, event, ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('submitSuccess', data)
            default: return action('submitFailure', data)
          }
        })
      }
    }
  }
})
