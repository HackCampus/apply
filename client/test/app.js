const test = require('ava')
const sinon = require('sinon')
const pull = require('pull-stream')

const app = require('../app')

// emits values given in the array after the specified timeouts.
// data : [[timeout, value]]
function timedSource(data) {
  return pull(
    pull.values(data),
    pull.asyncMap(function(item, cb) {
      setTimeout(function() {
        cb(null, item[1])
      }, item[0]);
    })
  )
}

const action = (type, payload) => ({type, payload})

test('init', t => {
  t.snapshot(app.init())
})

test('view', t => {
  const {model} = app.init()
  const dispatch = sinon.stub()
  const view = app.view(model, dispatch)
  t.snapshot(view.toString())
  t.false(dispatch.called)
})

test.cb('autosave - ignore everything other than application updates', t => {
  const actions = () => pull.values([action('ignore me')])
  const sources = {actions}
  pull(
    app.run(action('autosave'), sources),
    pull.collect((err, saveActions) => {
      t.deepEqual(saveActions, [])
      t.end()
    })
  )
})

test.cb('autosave - emit save when application changes', t => {
  const actions = () => pull.values([{child: 'personalDetails', action: action('whatever')}])
  const sources = {actions}
  pull(
    app.run(action('autosave'), sources),
    pull.collect((err, saveActions) => {
      t.deepEqual(saveActions, [action('saveApplication')])
      t.end()
    })
  )
})

test.cb('autosave - debounce', t => {
  const actions = () => timedSource([
    [0, {child: 'personalDetails', action: action('whatever')}],
    [100, {child: 'questions', action: action('whatever')}],
    [200, {child: 'techPreferences', action: action('whatever')}],
  ])
  const sources = {actions}
  pull(
    app.run(action('autosave'), sources),
    pull.collect((err, saveActions) => {
      t.deepEqual(saveActions, [action('saveApplication')])
      t.end()
    })
  )
})

test.cb('autosave - save again after 3 seconds', t => {
  const actions = () => timedSource([
    [0, {child: 'personalDetails', action: action('whatever')}],
    [100, {child: 'questions', action: action('whatever')}],
    [200, {child: 'techPreferences', action: action('whatever')}],
    [3500, {child: 'techPreferences', action: action('whatever')}],
  ])
  const sources = {actions}
  pull(
    app.run(action('autosave'), sources),
    pull.collect((err, saveActions) => {
      t.deepEqual(saveActions, [action('saveApplication'), action('saveApplication')])
      t.end()
    })
  )
})
