const test = require('ava')

const action = require('../action')

test('action', t => {
  t.snapshot(action('foo'))
  t.snapshot(action('foo', {bar: 'baz'}))
})
