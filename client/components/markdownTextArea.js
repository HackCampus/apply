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
    const renderedValue = markdown.render(value)
    const preview = document.createElement('div')
    preview.innerHTML = renderedValue
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
        <div class="previewContainer"><div class="preview">${preview}</div></div>
      </div>
    `
  },
  run () {}
})
