const {html} = require('inu')
const mapValues = require('lodash/mapValues')
const u = require('updeep')

const wireFormats = require('../../wireFormats')

const Component = require('../component')

const codeReview = require('./codeReview')
const markdownTextArea = require('./markdownTextArea')

const sampleAnswer = `# This is a sample answer

You can write your answer in the left box, and you will see a preview in the right box.

You can write links [like this](https://hackcampus.io/), and format your text in **bold** and *italics* like this.
`

const fields = mapValues(wireFormats.questions.properties, question => markdownTextArea(sampleAnswer))

const questions = Component({
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
    const {
      application,
      errorFields,
      readOnly,
    } = model
    const question = (name, title, description) => html`
      <div class="question">
      <h3 class=${errorFields[name] ? 'error' : ''}>${title}</h3>
      ${description}
      ${children[name]({startingValue: application && application[name], readOnly})}
      </div>
      `
    return html`
      <div class="questions">
        <p>The answers you give here help us assess your technical skills as well as your attitude towards software development.</p>
        <p>You can use Markdown to format your answers, eg. to add links. If you've never used Markdown before, don't worry - it's really simple! There's a <a target="_blank" href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet">cheat sheet</a> here.</p>

        ${question(
          'bestProject',
          'What is the coolest thing you have built?',
          html`<div>
          <p>This could be a hackathon project, or something you have been building on weekends and evenings. Ideally this shouldn't be a school project (unless you came up with the idea yourself!). If you have relevant work experience, definitely mention it too.</p>
          <p><em>This is the most useful question for us - the best answers contain links to code you've written, eg. on GitHub or your website, or links to working projects!</em></p>
          </div>`
        )}

        ${question(
          'mostExcitingTechnology',
          'What technology excites you the most?',
          html`<div>
          <p>We want to bring together people who believe that technology can always be improved - some amazing technological advancements are just around the corner. What technology excites you the most? Why is it so exciting?</p>
          </div>`
        )}

        ${question(
          'implementation',
          'Can you get from a vague idea to a working system?',
          html`<div>
          <p>Take a look at the following idea for a web app and tell us how you would implement it. The details are intentionally vague - in a startup environment, you often have to take initiative and come up with your own solutions to badly defined problems.</p>
          <em>
          <p>We want you to build the next big social network, Twidder, where users can broadcast updates about themselves to the public.</p>
          <ul>
            <li>Users should be able to publicly post a message that is up to 120 characters in length.</li>
            <li>All messages posted by a user should be accessible on a “profile” of theirs, ordered chronologically.</li>
            <li>Users should be able to “track” and be “tracked” by other users.</li>
            <li>Users should have access to a feed which displays messages from all of the people that they track, sorted chronologically.</li>
          </ul>
          </em>
          <p>Some questions to consider:</p>
          <ul>
            <li>What components would the system have and how would they interact?</li>
            <li>What is going to be the most difficult and/or time-consuming task?</li>
            <li>What tech stack would you use? Why?</li>
            <li>How long would this take to build?</li>
          </ul>
          </div>`
        )}

        ${question(
          'codeReview',
          'Do you have an eye for high-quality code?',
          html`<div>
          <p>Imagine you have to give your team-mate a code review for the following code snippet.</p>
          <p>What comments would you give?</p>
          ${codeReview}
          <p>Can you point out some of the flaws in this code?</p>
          <p>Some things you might want to consider:</p>
          <ul>
            <li>Is the function well-specified? Does it actually fit its specification?</li>
            <li>Is the code understandable? Does it do anything unexpected?</li>
            <li>Does it have any bugs?</li>
            <li>Is anything wrong with its style?</li>
            <li>Should your team-mate have written this function in the first place?</li>
          </ul>
          </div>`
        )}
      </div>
    `
  },
})

module.exports = questions
