const {pull, html} = require('inu')
const values = require('object.values')
const u = require('updeep')

const wireFormats = require('../../../wireFormats')

const action = require('../../lib/action')
const api = require('../../lib/api')
const dateFromNow = require('../../lib/dateFromNow')
const Component = require('../../lib/component')

const link = require('../../components/link')
const selectField = require('../../components/selectField')
const textArea = require('../../components/textArea')
const applicationView = require('../../components/applicationView')

const applicationEventTypes = wireFormats.applicationEventTypes
const applicationEventTypeValues = values(applicationEventTypes)
const applicationEventTypeKeys = Object.keys(applicationEventTypes)
const applicationEventCommented = wireFormats.applicationEventCommented

// TODO hacky
const applicationId = window.location.pathname.match(/application\/([^/]+)/)[1]

module.exports = Component({
  children: {
    actionType: selectField(applicationEventTypeValues),
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
        const application = a.payload
        const newModel = u({application}, model)
        return {model: newModel, effect: action('takeoverClipboard', application)}
      }
      case 'fetchApplicationEventsSuccess':
      case 'deleteApplicationEventSuccess': {
        const events = a.payload.events
        const newModel = u({events}, model)
        return {model: newModel, effect: null}
      }
      case 'fetchUserSuccess': {
        const user = a.payload
        const newModel = u({user}, model)
        return {model: newModel, effect: null}
      }

      case 'submit': {
        const selected = model.children.actionType.selected
        const event = {
          type: selected === -1 ? applicationEventCommented : applicationEventTypeKeys[selected],
          payload: {
            comment: model.children.comment.value,
          }
        }
        return {model, effect: action('submit', event)}
      }
      case 'submitSuccess': {
        const events = a.payload.events
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
            <h2 id="application">Application</h2>
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

      // make profile info easily pasteable by clicking on header.
      // TODO factor out public profile url generation.
      case 'takeoverClipboard': {
        const application = effect.payload
        document.addEventListener('copy', event => {
          if (event.target && event.target.id === 'application') {
            const sanitisedName = `${application.firstName}-${application.lastName}`.replace(' ', '-')
            const publicProfileUrl = `https://hackcampus-apply.herokuapp.com/profile/${application.profileToken}/${sanitisedName}`
            const clipboardData = `${application.firstName} ${application.lastName}\x09${document.location.href}\x09${publicProfileUrl}`
            event.clipboardData.setData('text/plain', clipboardData)
            event.preventDefault()
          }
        })
      }
    }
  }
})

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
    <p><span class="type">${applicationEventTypes[type] || 'comment'}</span> by <span class="actor">${actor.email}</span></p>
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
