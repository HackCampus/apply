module.exports = function getFormResponses (model) {
  const fields = {}
  for (let field in model.children) {
    const {value, started} = model.children[field]
    if (started) { // only send through the ones that have actually been updated
      fields[field] = value
    }
  }
  return fields
}
