const test = require('ava')
const sinon = require('sinon')
const pull = require('pull-stream')

const app = require('../app')

const fakeUser = () =>
  ({"id":1337,"email":"foo@bar.baz","connectedAccounts":{"github":true,"linkedin":false}})

const fakeApplication = () =>
  ({"id":631,"createdAt":"2016-12-10T18:58:00.135Z","updatedAt":null,"finishedAt":"2017-01-09T21:04:28.697Z","programmeYear":2017,"userId":2042,"firstName":"Foo","lastName":"Bar","contactEmail":"foo@bar.baz","gender":"other","dateOfBirth":"1993-01-27","university":"other (eg. international)","otherUniversity":"test university","courseName":"MSc in Unit Testing (Minor in Integration Testing)","courseType":"other","otherCourseType":"student of life","yearOfStudy":"other","otherYearOfStudy":"-1","graduationYear":"other","otherGraduationYear":"learning never ends","cvUrl":"http://lachenmayer.me","websiteUrl":"http://lachenmayer.me","referer":"other","refererDetail":"i made it","bestProject":"here's an answer with some *seriously **cool*** [markdown](http://lachenmayer.me).","mostExcitingTechnology":"here's a second answer with some *seriously **cool*** [markdown](http://lachenmayer.me).","implementation":"here's a third answer with some *seriously **cool*** [markdown](http://lachenmayer.me).","codeReview":"it's perfect m8.","perfectRole":"anything goes.","techPreferences":{"React":3,"Groovy / Grails":3,"Angular":0,"C#":3,"CSS":3,"Android":3,"Django":3,"ElasticSearch":3,"Go":3,"Docker":3,"Haskell":3,"iOS":3,"Java":3,"JavaScript":3,"Laravel":3,"MongoDB":3,"MySQL":3,"Neo4J":3,"Node.js":3,"Objective-C":3,"PHP":3,"PostgreSQL":3,"Python":3,"RabbitMQ":3,"Rails":3,"Redis":3,"Ruby":3,"Scala":3,"Swift":3}})

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

test('view - initial', t => {
  const {model} = app.init()
  const dispatch = sinon.stub()
  const view = app.view(model, dispatch)
  t.snapshot(view.toString())
  t.false(dispatch.called)
})

// TODO the following tests should be in a separate file that only tests
// the "authenticate" component.
test('view - email/password', t => {
  const {model} = app.init()
  model.children.authenticate.password = true
  const dispatch = sinon.stub()
  const view = app.view(model, dispatch)
  t.snapshot(view.toString())
  t.false(dispatch.called)
})

test('view - authenticated', t => {
  // We need to do this because we call document.createElement() in the markdownTextArea component.
  // Can be removed when that is no longer the case.
  global.document = require('min-document')

  const {model} = app.init()
  model.user = fakeUser()
  const dispatch = sinon.stub()
  const view = app.view(model, dispatch)
  t.snapshot(view.toString())
  t.false(dispatch.called)
})

test('view - change password', t => {
  // We need to do this because we call document.createElement() in the markdownTextArea component.
  // Can be removed when that is no longer the case.
  global.document = require('min-document')

  const {model} = app.init()
  model.user = fakeUser()
  model.children.authenticate.user = fakeUser()
  model.children.authenticate.changePassword = true
  const dispatch = sinon.stub()
  const view = app.view(model, dispatch)
  t.snapshot(view.toString())
  t.false(dispatch.called)
})

test('view - completed (but not finished) application', t => {
  // We need to do this because we call document.createElement() in the markdownTextArea component.
  // Can be removed when that is no longer the case.
  global.document = require('min-document')

  const {model} = app.init()
  model.user = fakeUser()
  model.children.authenticate.user = fakeUser()
  model.application = fakeApplication()
  model.application.finishedAt = null
  const dispatch = sinon.stub()
  const view = app.view(model, dispatch)

  t.snapshot(view.toString())
  t.false(dispatch.called)
})

test('view - finished application', t => {
  // We need to do this because we call document.createElement() in the markdownTextArea component.
  // Can be removed when that is no longer the case.
  global.document = require('min-document')

  const {model} = app.init()
  model.user = fakeUser()
  model.children.authenticate.user = fakeUser()
  model.application = fakeApplication()
  const dispatch = sinon.stub()
  const view = app.view(model, dispatch)

  t.snapshot(view.toString())
  t.false(dispatch.called)
})

//// TODO autosave tests need to be rethought...
//// pull.collect should only be called after 3 seconds, but it seems to be called immediately.
//
// test.cb('autosave - ignore everything other than application updates', t => {
//   const actions = () => pull.values([action('ignore me')])
//   const sources = {actions}
//   pull(
//     app.run(action('autosave'), sources),
//     pull.collect((err, saveActions) => {
//       t.deepEqual(saveActions, [])
//       t.end()
//     })
//   )
// })
//
// test.cb('autosave - emit save when application changes', t => {
//   const actions = () => pull.values([{child: 'personalDetails', action: action('whatever')}])
//   const sources = {actions}
//   pull(
//     app.run(action('autosave'), sources),
//     pull.collect((err, saveActions) => {
//       t.deepEqual(saveActions, [action('saveApplication')])
//       t.end()
//     })
//   )
// })
//
// test.cb('autosave - debounce', t => {
//   const actions = () => timedSource([
//     [0, {child: 'personalDetails', action: action('whatever')}],
//     [100, {child: 'questions', action: action('whatever')}],
//     [200, {child: 'techPreferences', action: action('whatever')}],
//   ])
//   const sources = {actions}
//   pull(
//     app.run(action('autosave'), sources),
//     pull.collect((err, saveActions) => {
//       t.deepEqual(saveActions, [action('saveApplication')])
//       t.end()
//     })
//   )
// })
//
// test.cb('autosave - save again after 3 seconds', t => {
//   const actions = () => timedSource([
//     [0, {child: 'personalDetails', action: action('whatever')}],
//     [100, {child: 'questions', action: action('whatever')}],
//     [200, {child: 'techPreferences', action: action('whatever')}],
//     [3500, {child: 'techPreferences', action: action('whatever')}],
//   ])
//   const sources = {actions}
//   pull(
//     app.run(action('autosave'), sources),
//     pull.collect((err, saveActions) => {
//       t.deepEqual(saveActions, [action('saveApplication'), action('saveApplication')])
//       t.end()
//     })
//   )
// })
