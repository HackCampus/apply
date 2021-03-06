const {html} = require('inu')
const moment = require('moment')

const markdownTextArea = require('./markdownText')

function techPreferences (techs) {
  const buckets = {}
  for (let tech in techs) {
    const preference = techs[tech]
    if (buckets[preference] == null) {
      buckets[preference] = []
    }
    buckets[preference].push(tech)
  }
  function preferenceList (i) {
    const bucket = buckets[i]
    if (bucket == null) return '-'
    return bucket.join(', ')
  }
  return html`
    <div class="techpreferences">
      <h3>3 - proficient</h3>
      <p>${preferenceList(3)}</p>
      <h3>2 - familiar</h3>
      <p>${preferenceList(2)}</p>
      <h3>1 - meh</h3>
      <p>${preferenceList(1)}</p>
      <h3>0 - never used</h3>
      <p>${preferenceList(0)}</p>
    </div>
  `
}

function companiesScore (score) {
  const columns = []
  for (let company in score) {
    columns.push([company, score[company]])
  }
  const toDisplay = columns
    .filter(([_, score]) => score !== 0)
    .sort(([_a, a], [_b, b]) => a === b ? 0 : a < b ? 1 : -1)
  return html`<div class="companiesScore">
    ${toDisplay.map(([company, score]) => html`<p><strong>${company}:</strong> ${score}</p>`)}
  </div>`
}

module.exports = function (application) {
  if (application == null) {
    return html``
  }

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

  const sanitisedName = `${application.firstName}-${application.lastName}`.replace(' ', '-')
  const publicProfileUrl = `https://apply.hackcampus.io/profile/${application.profileToken}/${sanitisedName}`

  return html`
    <div class="application">
      <table>
      <tr><td><strong>public profile link</strong></td><td><a target="_blank" href="${publicProfileUrl}">${publicProfileUrl}</a></td></tr>
      ${field('created at', 'createdAt', date => moment(date).format('DD.MM.YYYY'))}
      ${field('finished at', 'finishedAt', date => date ? moment(date).format('DD.MM.YYYY') : html`<em>unfinished</em>`)}
      ${field('previous applications', 'previousApplications', applications => html`<span>${Object.entries(applications).map(([year, id]) => html`<span><a href="/match/application/${id}">${year}</a> </span>`)}</span>`)}
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
      ${field('website', 'websiteUrl', website => website ? html`<a href="${website}">${website}</a>` : html`<em>none</em>`)}
      ${header('Referral')}
      ${field('referer', 'referer')}
      ${field('detail', 'refererDetail')}
      </table>
      <h2>Tech preferences</h2>
      ${techPreferences(application.techPreferences)}
      <h3>(Automatic) companies score</h3>
      ${companiesScore(application.companiesScore)}
      <h2>Questions</h2>
      ${question('Coolest thing you have built', 'bestProject')}
      ${question('Most exciting technology', 'mostExcitingTechnology')}
      ${question('Implementation', 'implementation')}
      ${question('Code review', 'codeReview')}
      ${question('Perfect role', 'perfectRole')}
    </div>
  `

}
