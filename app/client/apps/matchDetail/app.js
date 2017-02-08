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

function dateFromNow (date) {
  return html`<span title=${date}>${moment(date).fromNow()}</span>`
}

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
      },
      effect: action('fetchApplication'),
    }
  },
  update (model, a) {
    switch (a.type) {
      case 'submit':
        const event = {
          type: model.children.actionType.value || 'commented',
          payload: {
            comment: model.children.comment.value,
          }
        }
        return {model, effect: action('submit', event)}

      case 'fetchApplicationSuccess': {
        const newModel = u({application: a.payload}, model)
        return {model: newModel, effect: null}
      }
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
    } = model
    return html`
      <div class="actions">
        <h2>Actions</h2>
        <p>action: ${children.actionType()}</p>
        ${children.comment()}
        <a onclick=${() => dispatch(action('submit'))}>Submit</a>
        <h2>Events</h2>
        <table>
          <tr>
            <th>event</th>
            <th>time</th>
          </tr>
          ${application.finishedAt
            ? html`
              <tr>
                <td><strong>applicant</strong> finished application</td>
                <td>${dateFromNow(application.finishedAt)}</td>
              </tr>
            `
            : ''}
        </table>
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
            default: return action('fetchApplicationFailure')
          }
        })
      }

      case 'submit': {
        const event = effect.payload
        return post(`/applications/${applicationId}/events`, event, ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('fetchApplicationSuccess', data)
            default: return action('fetchApplicationFailure')
          }
        })
      }
    }
  }
})
