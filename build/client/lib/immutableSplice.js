module.exports = function (array, ...spliceArgs) {
  const newArray = array.slice();
  newArray.splice(...spliceArgs);
  return newArray;
};