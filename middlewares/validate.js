const validate = require('../validate')

module.exports = schema => (req, res, next) => {
  const errors = validate(req.body, schema)
  if (errors.length === 0) return next()
  next({status: 'Bad Request', error: {errors: errors.map(error => error.stack)}})
}
