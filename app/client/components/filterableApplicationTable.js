const {pull, html} = require('inu')
const h = html.createElement
const mapValues = require('lodash.mapvalues')
const querystring = require('qs')
const u = require('updeep')

const wireFormats = require('../../wireFormats')

const action = require('../lib/action')
const api = require('../lib/api')
const Component = require('../lib/component')

const applicationTable = require('./applicationTable')
const link = require('./link')
const tableFilter = require('./tableFilter')

const filters = {
  techs: Object.keys(wireFormats.techPreferences.properties),
  stages: Object.keys(wireFormats.applicationStages),
}

module.exports = Component({
  children: mapValues(filters, options => tableFilter(options)), // 'table' added dynamically on fetchApplicationsSuccess
  init () {
    return {
      model: {
        showFilters: false,
      },
      effect: action('fetchApplications'),
    }
  },
  update (model, a) {
    switch (a.type) {
      case 'showFilters': {
        const newModel = u({showFilters: true}, model)
        return {model: newModel, effect: null}
      }
      case 'hideFilters': {
        const newModel = u({showFilters: false}, model)
        return {model: newModel, effect: null}
      }

      case 'fetchApplications': {
        const query = {}
        for (let key of Object.keys(filters)) {
          const active = this.children[key].getActive(model.children[key])
          if (active.length > 0) {
            query[key] = active
          }
        }
        return {model, effect: action('fetchApplications', query)}
      }

      case 'fetchApplicationsSuccess': {
        const {applications} = a.payload
        return {model, effect: action('replaceChild', {
          key: 'table',
          newChild: applicationTable(applications, {orderBy: 'lastUpdatedAt'})
        })}
      }
      case 'fetchApplicationsFailure':
        console.error(a)
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    return h('div', {class: 'applications'}, [
      model.showFilters
        ? link('Hide filters', () => dispatch(action('hideFilters')))
        : link('Show filters', () => dispatch(action('showFilters'))),
      model.showFilters ? this.filtersView(model, dispatch, children) : '',
      children.table ? children.table() : '',
    ])
  },
  filtersView (model, dispatch, children) {
    return h('div', {class: 'filters'}, [
      h('h4', {}, ['Application stages']),
      children.stages(),
      h('h4', {}, ['Tech preferences']),
      children.techs(),
      h('div', {class: 'applyFilters'}, [link('Apply filters', () => dispatch(action('fetchApplications')))]),
    ])
  },
  run (effect, sources, action) {
    const get = (url, handler) =>
      pull(api.get(url), pull.map(handler))

    switch (effect.type) {
      case 'fetchApplications': {
        const query = querystring.stringify(effect.payload)
        return get(`/applications?${query}`, ({statusText, data}) => {
          switch (statusText) {
            case 'OK':
              return action('fetchApplicationsSuccess', data)
            default:
              return action('fetchApplicationsFailure', data)
          }
        })
      }

      case 'replaceChild': {
        const {key, newChild} = effect.payload
        return this.replaceChild(key, newChild, action)
      }
    }
  }
})
