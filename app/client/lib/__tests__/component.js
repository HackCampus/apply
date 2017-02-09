const test = require('ava')

const Component = require('../component')

test('init without children', t => {
  const component = Component({
    init () {
      return {model: 'foo', effect: 'bar'}
    }
  })
  const {model, effect} = component.init()
  t.deepEqual(model, 'foo')
  t.deepEqual(effect, 'bar')
})

test('init with children', t => {
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
  t.deepEqual(model, {
    children: {named: 'child'},
    foo: 'bar',
  })
  // TODO what is supposed to happen to effect?
})

test('update without children', t => {
  const component = Component({
    update (model, action) {
      return {model: 'yes'}
    }
  })
  t.deepEqual(component.update('no', 'anything'), {model: 'yes'})
  t.deepEqual(component.update('no', {child: 'no exist', action: 'foo'}), {model: 'yes'})
})


test('update with children', t => {
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
  t.deepEqual(component.update('no', 'anything'), {model: 'yes'})
  t.deepEqual(component.update('no', {child: 'named', action: 'foo'}), {model: 'yes'})
  const {model} = component.init()
  t.deepEqual(component.update(model, {child: 'named', action: 'foo'}), {model: {children: {named: 'yes from child'}}, effect: null})
})

test('view gets passed children', t => {
  const child = Component({
    view: function (model) { return model + 'o' }
  })
  const component = Component({
    children: {child},
    view (model, dispatch, children) {
      t.deepEqual(children.child(), 'fooo')
    }
  })
  component.view({children: {child: 'foo'}}, () => 'nothing')
})

test('replace child', t => {
  const child = value => Component({
    init () {
      return {
        model: {
          checkThis: value,
        },
        effect: null,
      }
    },
    view (model) {
      return model.checkThis
    },
  })
  const component = Component({
    children: {
      toReplace: child('one'),
    },
    init () {
      return {model: {}, effect: null}
    },
    view (model, dispatch, children) {
      return children.toReplace()
    },
  })
  let {model} = component.init()
  t.is(component.view(model, () => 'nothing'), 'one')
})
