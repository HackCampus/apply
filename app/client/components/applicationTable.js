const {pull, html} = require('inu')
const mapValues = require('lodash.mapvalues')
const u = require('updeep')
const values = require('object.values')

// const link = require('../../components/link')

const action = require('../lib/action')
const dateFromNow = require('../lib/dateFromNow')
const Component = require('../lib/component')

const direction = {
  ascending: true,
  descending: false,
}

function extractOrdering (applicationsArray) {
  let applications = {}
  let ordering = []
  for (let application of applicationsArray) {
    applications[application.id] = application
    ordering.push(application.id)
  }
  return {applications, ordering}
}

module.exports = (applicationsArray, excludeColumns = []) => {
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

  function sortApplications (model, column) {
    const {
      applications,
      orderBy,
      ordering,
    } = model
    let newOrderBy
    if (orderBy.column === column) {
      newOrderBy = {column, direction: !orderBy.direction}
    } else if (column != null) {
      newOrderBy = {column, direction: direction.descending}
    } else {
      newOrderBy = orderBy
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

  excludeColumns.forEach(exclude => {
    delete columns[exclude]
  })

  return Component({
    init () {
      const {applications, ordering} = extractOrdering(applicationsArray)
      return {
        model: sortApplications({
          applications,
          ordering,
          orderBy: {
            column: 'createdAt',
            direction: direction.descending,
          },
        }),
        effect: null,
      }
    },
    update (model, action) {
      switch (action.type) {
        case 'orderBy': {
          return {model: sortApplications(model, action.payload), effect: null}
        }
        default:
          return {model, effect: null}
      }
    },
    view (model, dispatch, children) {
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
      const mapColumns = fn => values(mapValues(columns, fn))
      return html`
        <div class="listView">
          <table>
            <tr>
              ${mapColumns(({title}, column) => html`<th onclick=${() => dispatch(action('orderBy', column))}>${title}${orderIndicator(column)}</th>`)}
            </tr>
            ${ordering.map((id, i) => html`
              <tr onclick=${() => window.open(`/match/application/${id}`) /* ew... can't create <a> tags in tables */}>
                ${mapColumns(({displayContent}) => html`<td>${displayContent(applications[id])}</td>`)}
              </tr>
            `)}
          </table>
        </div>
      `
    },
  })
}
