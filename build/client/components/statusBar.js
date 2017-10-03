const { html } = require('inu');

module.exports = (statusMessage, errorMessage) => {
  if (errorMessage) {
    return html`<div class="statusBar error">${errorMessage}</div>`;
  } else {
    return html`<div class="statusBar status">${statusMessage}</div>`;
  }
};