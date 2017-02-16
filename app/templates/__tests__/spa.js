const test = require('ava')

const shell = require('../shell')

test('shell', t => {
  t.true(typeof shell === 'function')
  t.snapshot(shell('foo'))
  t.snapshot(shell('bar'))
})
