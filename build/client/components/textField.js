const validatedTextField = require('./validatedTextField');

module.exports = (params = {}) => validatedTextField({ type: 'string' }, params);