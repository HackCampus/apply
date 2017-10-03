const {html} = require('inu')
const moment = require('moment')

module.exports = function dateFromNow (date) {
  return html`<span title=${date}>${moment(date).fromNow()}</span>`
}
