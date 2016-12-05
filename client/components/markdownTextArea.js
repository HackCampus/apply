const {html} = require('inu')
const markdown = require('markdown-it')({
  linkify: true,
})

module.exports = (emptyValue = '') => ({
  init () {
    return {
      model: {
        // readOnly: set by parent
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
    const {readOnly, started, startingValue} = model
    let {value} = model
    if (!started) {
      value = startingValue
        ? startingValue
        : emptyValue
    }
    // FIXME hackhackhackhack
    // bel for some reason does not like hrefs wrapped in ""s...?
    // to reproduce: html('<a href="foo"></a>')
    const renderedValue = markdown.render(value).replace(/href="(.+)"/g, function (_, link) {
      return `href=${link}`
    })
    return html`
      <div class="markdownTextArea">
        ${!readOnly
          ? html`
            <div class="textareaContainer">
              <textarea
                oninput=${e => dispatch(e.target.value)}
                onfocus=${() => !started && !startingValue && dispatch('')}
              >${value}</textarea>
            </div>`
          : ''
        }
        <div class="previewContainer">${html(`<div class=preview>${renderedValue}</div>`)}</div>
      </div>
    `
  },
  run () {}
})
