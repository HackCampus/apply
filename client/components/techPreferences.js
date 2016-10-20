const {html} = require('inu')
const mapValues = require('lodash/mapvalues')
const u = require('updeep')

const wireFormats = require('../../wireFormats')

const Component = require('../component')

const choiceField = require('./choiceField')

const technologies = Object.keys(wireFormats.techPreferences.properties)
const fields = mapValues(wireFormats.techPreferences.properties, tech => choiceField(tech.enum))

const techPreferences = Component({
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
    const {application} = model
    return html`
      <div class="techpreferences">
        <p>Help us match you to the perfect role by telling us what your technologies of choice are.</p>
        <p><strong>0:</strong> I have never used <em>X</em>.</p>
        <p><strong>1:</strong> I have read about <em>X</em>, or I have only used it once, or have used it and would prefer not to work with it.</p>
        <p><strong>2:</strong> I am familiar with <em>X</em>, and/or would be comfortable taking on a role where I have to use <em>X</em>.</p>
        <p><strong>3:</strong> I am completely proficient in <em>X</em>, ie. I have used it for several projects.</p>
        <p><strong>Note:</strong> If you don't find your favourite tech here, don't worry - just tell us about what you've built with it in the next section! :)</p>
        <table>
          <tr>
            <th>Technology</th>
            <th>Preference</th>
          </tr>
          ${technologies.map(tech =>
            html`<tr><td>${tech}</td><td>${
              children[tech](application
                ? {startingValue: application.techPreferences[tech]}
                : {})
            }</td></tr>`)}
        </table>
      </div>
    `
  },
})

techPreferences.getFormResponses = function (model) {
  const fields = {}
  for (let tech in model.children) {
    const {started, value} = model.children[tech]
    if (started) {
      fields[tech] = value
    }
  }
  return fields
}

module.exports = techPreferences
