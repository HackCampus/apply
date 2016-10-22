const {html} = require('inu')
const markdown = require('markdown-it')({
  linkify: true,
})

module.exports = () => ({
  init () {
    return {
      model: {
        started: false,
        // startingValue: set by parent
        value: '',
      },
      effect: null,
    }
  },
  update (model, newValue) {
    return {
      model: {
        started: true,
        value: newValue,
      }
    }
  },
  view (model, dispatch) {
    const {started, startingValue} = model
    let {value} = model
    if (!started && startingValue) {
      value = startingValue
    }
    // FIXME hackhackhackhack
    // bel for some reason does not like hrefs wrapped in ""s...?
    // to reproduce: html('<a href="foo"></a>')
    const renderedValue = markdown.render(value).replace(/href="(.+)"/, function (_, link) {
      return `href=${link}`
    })
    return html`
      <div class="markdownTextArea">
        <div class="textareaContainer">
          <textarea
            oninput=${e => dispatch(e.target.value)}
            onfocus=${() => !started && dispatch('')}
          >${value}</textarea>
        </div>
        <div class="previewContainer">${html(`<div class=preview>${renderedValue}</div>`)}</div>
      </div>
    `
  },
  run () {}
})
