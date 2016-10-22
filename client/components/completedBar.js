const {html} = require('inu')

module.exports = (completed) => {
  return html`
    <div class="completedBar">
      ${Object.keys(completed).map(sectionName => html`
          <div class=${sectionName}>
            ${Object.keys(completed[sectionName]).map(done => html`<div class=${completed[sectionName][done] ? 'complete' : 'incomplete'}></div>`)}
          </div>
        `
      )}
    </div>
  `
}
