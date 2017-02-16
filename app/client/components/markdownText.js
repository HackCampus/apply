const {html} = require('inu')

const markdown = require('markdown-it')({
  linkify: true,
})

module.exports = function markdownText (text) {
  if (text == null) {
    return html`<div><em>no answer given</em></div>`
  }
  const renderedText = markdown.render(text)
  const textArea = document.createElement('div')
  textArea.innerHTML = renderedText
  return textArea
}
