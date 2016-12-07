const test = require('ava')
const sinon = require('sinon')

const {envNumber} = require('../envHelpers')

test('envNumber', t => {
  process.env.numberValue = '123'
  const numberValue = envNumber('numberValue')
  t.is(numberValue, 123, 'number gets parsed')

  const warns = sinon.spy(console, 'warn')
  const doesntExist = envNumber('DOESNT_EXIST')
  t.falsy(doesntExist)
  t.true(warns.called)

  process.env.nonNumberValue = 'foo'
  const nonNumberValue = envNumber('nonNumberValue')
  t.is(nonNumberValue, 'foo', 'non-number gets passed along but warns')
  t.true(warns.calledTwice)
})
