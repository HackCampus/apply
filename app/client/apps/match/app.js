const {pull, html} = require('inu')
const keyMirror = require('keymirror')
const u = require('updeep')

const link = require('../../components/link')

const action = require('../../lib/action')
const api = require('../../lib/api')
const Component = require('../../lib/component')

const views = keyMirror({
  list: null,
  detail: null,
})

module.exports = Component({
  children: {},
  init () {
    return {
      model: {
        applications: [],
        view: views.list,
        detail: null,
      },
      effect: action('fetchApplications'),
    }
  },
  update (model, action) {
    switch (action.type) {
      case 'fetchApplicationsSuccess': {
        const newModel = u({applications: action.payload}, model)
        return {model: newModel, effect: null}
      }
      case 'showDetail': {
        const newModel = u({view: views.detail, detail: action.payload}, model)
        return {model: newModel, effect: null}
      }
      case 'showList': {
        const newModel = u({view: views.list, detail: null}, model)
        return {model: newModel, effect: null}
      }
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    const {
      view,
    } = model
    return html`
      <div class="matching">
        ${this.headerView(model, dispatch, children)}
        ${(() => {
          switch (view) {
            case views.list: return this.listView(model, dispatch, children)
            case views.detail: return this.detailView(model, dispatch, children)
          }
        })()}
      </div>
    `
  },
  headerView (model, dispatch, children) {
    const {
      view,
    } = model
    return html`
      <div class="header">
        <p>${view !== views.list ? link('< Back to list view', () => dispatch(action('showList'))) : ''}
      </div>
    `
  },
  listView (model, dispatch, children) {
    const {
      applications,
    } = model
    return html`
      <div class="listView">
        <table>
          <tr>
            <th>Name</th>
            <th>Created at</th>
            <th>Finished at</th>
            <th>Status</th>
            <th>Last updated at</th>
          </tr>
          ${applications.map((application, i) => html`
            <tr onclick=${() => dispatch(action('showDetail', i))}>
              <td>${application.firstName + ' ' + application.lastName}</td>
              <td>${application.createdAt}</td>
              <td>${application.finishedAt}</td>
              <td>TODO</td>
              <td>TODO</td>
            </tr>
          `)}
        </table>
      </div>
    `
  },
  detailView (model, dispatch, children) {
    const {
      applications,
      detail,
    } = model
    const application = applications[detail]
    return html`
      <div class="detailView">
        <table>
          <tr>
            <th>Application</th>
            <th>Actions</th>
          </tr>
          <tr>
            <td>${application.lastName}</td>
            <td>TODO</td>
          </tr>
      </div>
    `
  },
  run (effect, sources, action) {
    const get = (url, handler) =>
      pull(api.get(url), pull.map(handler))
    const put = (url, body, handler) =>
      pull(api.put(url, body), pull.map(handler))
    switch (effect.type) {
      case 'fetchApplications':
        return get('/applications', ({statusText, data}) => {
          switch (statusText) {
            case 'OK': return action('fetchApplicationsSuccess', data)
            default: return action('fetchApplicationsError', data)
          }
        })
      default:
        return null
    }
  }
})
