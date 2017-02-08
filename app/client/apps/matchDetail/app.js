const {pull, html} = require('inu')
const moment = require('moment')
const u = require('updeep')

const wireFormats = require('../../../wireFormats')

const action = require('../../lib/action')
const api = require('../../lib/api')
const Component = require('../../lib/component')

const link = require('../../components/link')
const selectField = require('../../components/selectField')
const textArea = require('../../components/textArea')
const applicationView = require('../../components/applicationView')

const possibleActions = wireFormats.applicationEvent.properties.type.enum

// TODO hacky
const applicationId = window.location.pathname.match(/application\/([^/]+)/)[1]

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
        user: null,
      },
      effect: [action('fetchApplication'), action('fetchApplicationEvents'), action('fetchUser')],
    }
  },
  update (model, a) {
    switch (a.type) {
      case 'deleteApplicationEvent': {
        return {model, effect: a}
      }

      case 'fetchApplicationSuccess': {
        const newModel = u({application: a.payload}, model)
        return {model: newModel, effect: null}
      }
      case 'fetchApplicationEventsSuccess':
      case 'deleteApplicationEventSuccess': {
        const events = a.payload.events.reverse()
        const newModel = u({events}, model)
        return {model: newModel, effect: null}
      }
      case 'fetchUserSuccess': {
        const user = a.payload
        const newModel = u({user}, model)
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
      case 'deleteApplicationEventFailure':
      case 'fetchUserFailure':
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
        <div class="header">
          <h1>HackCampus matching</h1>
          <a href="/match">← Back to overview</a>
        </div>
        <div class="body">
          <div class="applicationview">
            <h2>Application</h2>
            ${applicationView(application)}
          </div>
          ${this.actionsView(model, dispatch, children)}
        </div>
      </div>
    `
  },
  actionsView (model, dispatch, children) {
    const {
      application,
      events,
      user,
    } = model

    return html`
      <div class="actions">
        <h2>Matching history</h2>
        <p>action: ${children.actionType()}</p>
        ${children.comment()}
        ${link('Submit', () => dispatch(action('submit')))}
        <div class="events">
          ${events && events.length > 0
            ? events.map(event => eventView(event, user, () => dispatch(action('deleteApplicationEvent', event.id))))
            : html`<div class="event"><em>No events yet!</em></div>`}
        </div>
      </div>
    `
  },
  run (effect, sources, action) {
    const get = (url, handler) =>
      pull(api.get(url), pull.map(handler))
    const post = (url, body, handler) =>
      pull(api.post(url, body), pull.map(handler))
    const doDelete = (url, handler) =>
      pull(api.delete(url), pull.map(handler))
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

      case 'deleteApplicationEvent': {
        const eventId = effect.payload
        return doDelete(`/applications/${applicationId}/events/${eventId}`, ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('deleteApplicationEventSuccess', data)
            default: return action('deleteApplicationEventFailure', data)
          }
        })
      }

      case 'fetchUser': {
        return get(`/me`, ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('fetchUserSuccess', data)
            default: return action('fetchUserFailure', data)
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

function dateFromNow (date) {
  return html`<span title=${date}>${moment(date).fromNow()}</span>`
}

function eventView (event, user, onDelete) {
  const {
    id,
    ts,
    actor,
    type,
    payload,
  } = event
  const isMine = user && user.id == actor.id
  return html`<div class="event">
    <p><span class="type">${type}</span> by <span class="actor">${actor.email}</span></p>
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
    <p><span class="ts">${dateFromNow(ts)}</span> ${isMine ? link('delete', onDelete, {class: 'eventdelete'}) : ''}</p>
  </div>`
}
