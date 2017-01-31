const {pull, html} = require('inu')
const keyMirror = require('keymirror')
const mapValues = require('lodash.mapvalues')
const moment = require('moment')
const u = require('updeep')

const applicationView = require('../../components/applicationView')
const link = require('../../components/link')

const action = require('../../lib/action')
const api = require('../../lib/api')
const Component = require('../../lib/component')

const views = keyMirror({
  list: null,
  detail: null,
})

const direction = {
  ascending: true,
  descending: false,
}

function dateFromNow (date) {
  return html`<span title=${date}>${moment(date).fromNow()}</span>`
}

const columns = {
  name: {
    title: 'Name',
    displayContent: application => {
      if (application.firstName == null && application.lastName == null) {
        return html`<em>no name entered</em>`
      }
      return application.firstName + ' ' + application.lastName
    },
    sortContent: application => {
      if (application.firstName == null && application.lastName == null) {
        return ''
      }
      return application.firstName + ' ' + application.lastName
    },
  },
  university: {
    title: 'University',
    displayContent: application => (application.university === 'other (eg. international)' ? html`<em>${application.otherUniversity}</em>` : application.university) || html`<em>-</em>`,
    sortContent: application => (application.university === 'other (eg. international)' ? application.otherUniversity : application.university) || '',
  },
  gender: {
    title: 'Gender',
    displayContent: application => (application.gender === 'other' ? application.otherGender : application.gender) || html`<em>-</em>`,
    sortContent: application => (application.gender === 'other' ? application.otherGender : application.gender) || '',
  },
  createdAt: {
    title: 'Created',
    displayContent: application => dateFromNow(application.createdAt),
    sortContent: application => application.createdAt,
  },
  finishedAt: {
    title: 'Finished',
    displayContent: application => application.finishedAt ? dateFromNow(application.finishedAt) : html`<em>-</em>`,
    sortContent: application => application.finishedAt || '',
  },
  // status: {
  //   title: 'Status',
  // },
  // lastUpdatedAt: {
  //   title: 'Last updated at',
  // },
}

module.exports = Component({
  children: {},
  init () {
    return {
      model: {
        view: views.list,

        // list view
        applications: [],
        ordering: [],
        orderBy: {
          column: 'createdAt',
          direction: direction.ascending,
        },

        // detail view
        detailRow: null,
      },
      effect: action('fetchApplications'),
    }
  },
  update (model, action) {
    switch (action.type) {
      case 'fetchApplicationsSuccess': {
        const applicationsList = action.payload
        let applications = {}
        let ordering = []
        for (let application of applicationsList) {
          applications[application.id] = application
          ordering.push(application.id)
        }
        const newModel = u({applications, ordering}, model)
        return {model: sortApplications(newModel, 'finishedAt'), effect: null}
      }
      case 'showDetail': {
        const newModel = u({view: views.detail, detailRow: action.payload}, model)
        return {model: newModel, effect: null}
      }
      case 'showList': {
        const newModel = u({view: views.list, detailRow: null}, model)
        return {model: newModel, effect: null}
      }
      case 'orderBy': {
        return {model: sortApplications(model, action.payload), effect: null}
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
      orderBy,
      ordering,
    } = model
    const orderIndicator = column => {
      if (orderBy.column === column) {
        return orderBy.direction === direction.ascending
          ? html` 🔼`
          : html` 🔽`
      }
    }
    const mapColumns = fn => Object.values(mapValues(columns, fn))
    return html`
      <div class="listView">
        <table>
          <tr>
            ${mapColumns(({title}, column) => html`<th onclick=${() => dispatch(action('orderBy', column))}>${title}${orderIndicator(column)}</th>`)}
          </tr>
          ${ordering.map((id, i) => html`
            <tr onclick=${() => dispatch(action('showDetail', i))}>
              ${mapColumns(({displayContent}) => html`<td>${displayContent(applications[id])}</td>`)}
            </tr>
          `)}
        </table>
      </div>
    `
  },
  detailView (model, dispatch, children) {
    const {
      applications,
      detailRow,
      ordering,
    } = model
    const application = applications[ordering[detailRow]]
    return html`
      <div class="detailView">
        ${applicationView(application)}
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

function sortApplications (model, column) {
  const {
    applications,
    orderBy,
    ordering,
  } = model
  let newOrderBy
  if (orderBy.column === column) {
    newOrderBy = {column, direction: !orderBy.direction}
  } else {
    newOrderBy = {column, direction: direction.descending}
  }
  const newOrdering = ordering.slice()
  newOrdering.sort((a, b) => {
    const applicationA = applications[a]
    const applicationB = applications[b]
    const column = columns[newOrderBy.column].sortContent
    const top = column(applicationA)
    const bottom = column(applicationB)
    if (top === bottom) {
      return 0
    }
    return newOrderBy.direction === direction.ascending
      ? top < bottom ? -1 : 1
      : top > bottom ? -1 : 1
  })
  return u({orderBy: newOrderBy, ordering: newOrdering}, model)
}
