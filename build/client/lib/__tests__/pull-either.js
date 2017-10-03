const test = require('ava');
const pull = require('pull-stream');

const either = require('../pull-either');

test('success', assert => {
  assert.plan(2);
  pull(pull.values([1, 2, 3]), either(x => x * 2, x => x * 3), pull.collect((err, values) => {
    assert.falsy(err);
    assert.deepEqual(values, [2, 4, 6]);
  }));
});

test('failure', assert => {
  assert.plan(2);
  pull(pull.error('foo'), either(x => x, x => x.toUpperCase()), pull.collect((err, values) => {
    assert.falsy(err);
    assert.deepEqual(values, ['FOO']);
  }));
});