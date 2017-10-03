const pull = require('pull-stream');

// emits an action with the given delay (in ms), unless interrupted by another
// action.
module.exports = function uninterrupted(delay) {
  return function (read) {
    let timeout;
    return function (abort, cb) {
      read(abort, function next(err, data) {
        clearTimeout(timeout);
        if (err) return cb(err);
        timeout = setTimeout(function () {
          cb(null, data);
        }, delay);
        read(abort, next);
      });
    };
  };
};