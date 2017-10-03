module.exports = function contains (array, element) {
  return Array.isArray(array) && array.indexOf(element) !== -1
}
