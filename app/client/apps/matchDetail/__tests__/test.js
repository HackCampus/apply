const test = require('ava')
const sinon = require('sinon')

const app = require('../app')

test('init', t => {
  global.window = {
    location: {
      hash: ''
    }
  }
  t.snapshot(app.init())
})

test('view - initial', t => {
  global.window = {
    location: {
      hash: ''
    }
  }
  const {model} = app.init()
  const dispatch = sinon.stub()
  const view = app.view(model, dispatch)
  t.snapshot(view.toString())
  t.false(dispatch.called)
})
