const validate = require('../validate')

module.exports = schema => (req, res, next) => {
  const errors = validate(req.body, schema)
  if (errors.length === 0) return next()
  const errorFields = errors.map(error => error.property.replace('instance.', ''))
  next({status: 'Bad Request', error: {errors: errorFields}})
}
