module.exports = function getApplicationStatus (events) {
  if (!Array.isArray(events)) {
    throw new TypeError()
  }
  return 'foo'
}
