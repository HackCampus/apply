const { html } = require('inu');
const extend = require('xtend');

module.exports = function link(text, onclick = function () {}, params) {
  return html.createElement('a', extend({
    href: `javascript:void('hey there ✌︎')`,
    onclick
  }, params), [text]);
};