const {Action} = require('inux')

const navigate = url => {
  window.history.pushState(null, null, url)
}

module.exports = {
  navigate,
}
