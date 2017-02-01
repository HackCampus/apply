const {html} = require('inu')
const moment = require('moment')

function markdownTextArea (text) {
  const markdown = require('markdown-it')({
    linkify: true,
  })
  const renderedText = markdown.render(text)
  const textArea = document.createElement('div')
  textArea.innerHTML = renderedText
  return textArea
}

module.exports = function (application) {
  function header (title) {
    return html`<tr><td colspan=2><h3>${title}</h3></td></tr>`
  }
  function field (title, fieldName, transform) {
    transform = typeof transform === 'function' ? transform : id => id
    return html`<tr><td>${title}</td><td>${transform(application[fieldName])}</td></tr>`
  }
  function other (otherFieldName, other) {
    other = other || 'other'
    return field => field === other ? application[otherFieldName] : field
  }
  function question (question, fieldName) {
    return html`
      <div class="question">
        <h3>${question}</h3>
        <div class="markdownTextArea">
          ${markdownTextArea(application[fieldName])}
        </div>
      </div>`
  }
  return html`
    <div class="application">
      <h2>Personal details</h2>
      <table>
      ${header('Contact details')}
      ${field('first name', 'firstName')}
      ${field('last name', 'lastName')}
      ${field('contact email', 'contactEmail')}
      ${field('gender', 'gender')}
      ${field('date of birth', 'dateOfBirth', date => `${moment(date).format('DD.MM.YYYY')} (${moment(date).fromNow(true)} old)`)}
      ${header('Education')}
      ${field('university', 'university', other('otherUniversity', 'other (eg. international)'))}
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
      <h2>Tech preferences - TODO</h2>
      <h2>Questions</h2>
      ${question('Coolest thing you have built', 'bestProject')}
      ${question('Most exciting technology', 'mostExcitingTechnology')}
      ${question('Implementation', 'implementation')}
      ${question('Code review', 'codeReview')}
      ${question('Perfect role', 'perfectRole')}
    </div>
  `

}
