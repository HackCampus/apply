const { pull, html } = require('inu');
const u = require('updeep');

const action = require('../../lib/action');
// const api = require('../../lib/api')
const Component = require('../../lib/component');

const markdownText = require('../../components/markdownText');

module.exports = application => Component({
  children: {
    // TODO add children...
  },
  init() {
    return {
      model: {},
      effect: null
    };
  },
  update(model, action) {
    switch (action.type) {
      // case 'changeMe': {
      //   const newModel = u({changeMe: 'please'}, model)
      //   return {model: newModel, effect: null}
      // }
      default:
        return { model, effect: null };
    }
  },
  view(model, dispatch, children) {
    const field = (className, label, content) => html`<p class="${className}"><strong>${label}:</strong> ${content}</p>`;
    return html`
      <div class="profile">
        <h1>HackCampus ${application.programmeYear || ''} - ${application.firstName} ${application.lastName}</h1>
        ${application.matcherComment ? html`<div class="matcherComment"><p class="context">${markdownText(application.matcherComment)}</p></div>` : ''}
        <h3>Contact details</h3>
        ${field('name', 'name', `${application.firstName} ${application.lastName}`)}
        ${field('cv', 'CV', html`<a href="${application.cvUrl}">Link to CV</a>`)}
        ${application.websiteUrl ? field('website', 'website', html`<a href="${application.websiteUrl}">${application.websiteUrl}</a>`) : ''}
        <h3>Education</h3>
        ${field('university', 'university', application.university === 'other (eg. international)' ? application.otherUniversity : application.university)}
        ${field('courseName', 'course', `${application.courseName}`)}
        ${field('yearOfStudy', 'year of study', application.yearOfStudy === 'other' ? application.otherYearOfStudy : `${application.yearOfStudy}  (${application.courseType})`)}
        ${field('graduationYear', 'graduation year (expected)', application.graduationYear === 'other' ? application.otherGraduationYear : application.graduationYear)}
        <h3>Best project</h3>
        <p class="context">As part of their application, we asked ${application.firstName} about the project(s) they are most proud of. This is what they had to say:</p>
        <div class="bestProject">${markdownText(application.bestProject)}</div>
      </div>
    `;
  }
} // run (effect, sources, action) {
//   const get = (url, handler) =>
//     pull(api.get(url), pull.map(handler))
//   switch (effect.type) {
//     case 'foo': {
//     }
//   }
// }
);