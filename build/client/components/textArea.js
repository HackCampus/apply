const { html } = require('inu');
const markdown = require('markdown-it')({
  linkify: true
});

module.exports = (emptyValue = '') => ({
  init() {
    return {
      model: {
        started: false,
        // startingValue: set by parent
        value: ''
      },
      effect: null
    };
  },
  update(model, newValue) {
    return {
      model: {
        started: true,
        value: newValue
      }
    };
  },
  view(model, dispatch) {
    const { started, startingValue } = model;
    let { value } = model;
    if (!started) {
      value = startingValue ? startingValue : emptyValue;
    }
    return html`
      <div class="textArea">
        <textarea
          oninput=${e => dispatch(e.target.value)}
          onfocus=${() => !started && !startingValue && dispatch('')}
        >${value}</textarea>
      </div>`;
  },
  run() {}
});