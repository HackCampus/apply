module.exports = function intersection(a, b) {
  a = new Set(a);
  const intersection = new Set();
  for (let elem of b) {
    if (a.has(elem)) {
      intersection.add(elem);
    }
  }
  return intersection;
};