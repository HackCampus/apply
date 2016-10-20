const {html} = require('inu')
const u = require('updeep')

const technologies = require('../../technologies')

const Component = require('../component')

const choiceField = require('./choiceField')

const fields = {}
technologies.forEach(tech => {
  fields[tech] = choiceField(['0', '1', '2', '3'])
})

module.exports = Component({
  children: fields,
  init () {
    return {
      model: {},
      effect: null,
    }
  },
  update (model, action) {
    switch (action.type) {
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    return html`
      <div class="techpreferences">
        <p>Help us match you to the perfect role by telling us what your technologies of choice are.</p>
        <p><strong>0:</strong> I have never used <em>X</em>.</p>
        <p><strong>1:</strong> I have read about <em>X</em>, or I have only used it once, or have used it and would prefer not to work with it.</p>
        <p><strong>2:</strong> I am familiar with <em>X</em>, and/or would be comfortable taking on a role where I have to <em>X</em>.</p>
        <p><strong>3:</strong> I am completely proficient in <em>X</em>, ie. I have used it for several projects.</p>
        <p><strong>Note:</strong> If you don't find your favourite tech here, don't worry - just tell us about what you've built with it in the next section! :)</p>
        <table>
          <tr>
            <th>Technology</th>
            <th>Preference</th>
          </tr>
          ${technologies.map(tech => html`<tr><td>${tech}</td><td>${children[tech]()}</td></tr>`)}
        </table>
      </div>
    `
  },
  // run (effect, sources, action) {}
})
