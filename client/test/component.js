const test = require('ava')

const Component = require('../component')

test('init without children', assert => {
  const component = Component({
    init () {
      return {model: 'foo', effect: 'bar'}
    }
  })
  const {model, effect} = component.init()
  assert.deepEqual(model, 'foo')
  assert.deepEqual(effect, 'bar')
})

test('init with children', assert => {
  const child = Component({
    init () {
      return {model: 'child', effect: 'child'}
    }
  })
  const component = Component({
    children: {
      named: child,
    },
    init () {
      return {model: {foo: 'bar'}, effect: 'bar'}
    }
  })
  const {model, effect} = component.init()
  assert.deepEqual(model, {
    children: {named: 'child'},
    foo: 'bar',
  })
  // TODO what is supposed to happen to effect?
})

test('update without children', assert => {
  const component = Component({
    update (model, action) {
      return {model: 'yes'}
    }
  })
  assert.deepEqual(component.update('no', 'anything'), {model: 'yes'})
  assert.deepEqual(component.update('no', {child: 'no exist', action: 'foo'}), {model: 'yes'})
})


test('update with children', assert => {
  const child = Component({
    update (model, action) {
      return {model: 'yes from child'}
    }
  })
  const component = Component({
    children: {named: child},
    update (model, action) {
      return {model: 'yes'}
    }
  })
  assert.deepEqual(component.update('no', 'anything'), {model: 'yes'})
  assert.deepEqual(component.update('no', {child: 'named', action: 'foo'}), {model: 'yes'})
  const {model} = component.init()
  assert.deepEqual(component.update(model, {child: 'named', action: 'foo'}), {model: {children: {named: 'yes from child'}}, effect: null})
})

test('view gets passed children', assert => {
  const child = Component({
    view: function (model) { return model + 'o' }
  })
  const component = Component({
    children: {child},
    view (model, dispatch, children) {
      assert.deepEqual(children.child(), 'fooo')
    }
  })
  component.view({children: {child: 'foo'}}, () => 'nothing')
})
