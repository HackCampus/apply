const {html} = require('inu')
const moment = require('moment')

module.exports = function (application) {
  function header (title) {
    return html`<tr><td colspan=2><h3>${title}</h3></td></tr>`
  }
  function field (title, fieldName, transform) {
    transform = typeof transform === 'function' ? transform : id => id
    return html`<tr><td>${title}</td><td>${transform(application[fieldName])}</td></tr>`
  }
  function other (otherFieldName) {
    return field => field === 'other' ? application[otherFieldName] : field
  }
  return html`
    <div class="application">
      <table>
      ${header('Personal details')}
      ${field('first name', 'firstName')}
      ${field('last name', 'lastName')}
      ${field('contact email', 'contactEmail')}
      ${field('gender', 'gender')}
      ${field('date of birth', 'dateOfBirth', date => `${moment(date).format('DD.MM.YYYY')} (${moment(date).fromNow(true)} old)`)}
      ${header('Education')}
      ${field('university', 'university', other('otherUniversity'))}
      ${field('course name', 'courseName', 'eg. "Computer Science", "Physics"')}
      ${field('course type', 'courseType', other('otherCourseType'))}
      ${field('year of study', 'yearOfStudy', other('otherYearOfStudy'))}
      ${field('(expected) year of graduation', 'graduationYear', other('otherGraduationYear'))}
      ${header('Links')}
      ${field('link to CV', 'cvUrl', cvUrl => html`<a href="${cvUrl}">Link to CV</a>`)}
      ${field('website', 'website', website => website ? html`<a href="${website}">${website}</a>` : html`<em>none</em>`)}
      ${header('Referral')}
      ${field('referer', 'referer')}
      ${field('detail', 'refererDetail')}
      </table>
    </div>
  `

}
