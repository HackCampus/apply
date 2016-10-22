const empty = x => x == null || x === ''
module.exports = function getCompleted (model, application) {
  application = application || {}
  const completed = {}
  for (let field in model.children) {
    const {value, started} = model.children[field]
    completed[field] = (started && !empty(value)) || !empty(application[field])
  }
  return completed
}
