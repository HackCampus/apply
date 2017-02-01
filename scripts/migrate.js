const knex = require('knex')
const pullPromise = require('pull-promise')
const pull = require('pull-stream')
const toStream = require('pull-stream-to-stream')

const env = require('../app/env')

const {Database, Authentication, User, Application} = require('../app/database')
const oldDb = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'harry',
    password: '',
    database: 'old',
    charset: 'utf8',
  },
})

const log = (x, ...messages) => {console.log(...messages, x); return x}

const auth = userId =>
  oldDb.select().from('social_auth_usersocialauth').where('user_id', userId)
const application = userId =>
  oldDb.select().from('hcportal_internshipapplication').where('user_id', userId)

const createUser = user =>
  new User({
    createdAt: user.date_joined,
    email: user.email,
    role: user.is_staff ? 'matcher' : 'applicant',
  }).save(null)

const createPasswordAuth = (userId, user) =>
  new Authentication({
    userId,
    createdAt: user.date_joined,
    type: 'password',
    identifier: user.email,
    token: user.password,
  }).save(null)

const getExistingUser = user =>
  User.where('email', user.email).fetch()

const createApplication = (userId, user, application) => {
  let gender = application.gender && application.gender.toLowerCase()
  if (gender !== 'male' && gender !== 'female') {
    gender = 'other'
  }

  const programmeYear =
    application.is_old_applicant
      ? 2015
      : user.date_joined < new Date('2016-06-01')
        ? 2016
        : 2017

  return new Application({
    userId,
    createdAt: user.date_joined,
    finishedAt: application.end_time,
    programmeYear,
    firstName: application.first_name,
    lastName: application.last_name,
    contactEmail: user.email,
    gender: gender,
    dateOfBirth: application.dob,
    university: application.university,
    otherUniversity: application.other_university,
    // courseName
    // courseType
    // otherCourseType
    yearOfStudy: application.university_year,
    graduationYear: application.graduation_year,
    cvUrl: application.cv,
    websiteUrl: application.website,
    // referer
    refererDetail: application.source,
    bestProject: application.best_project,
    mostExcitingTechnology: application.interesting_tech,
    implementation: application.implementation,
    codeReview: application.code_review,
  }).save(null)
}

const createTokenAuthentications = (userId, user, auth) =>
  Promise.all(auth.map(a => {
    const type = a.provider === 'linkedin-oauth2' ? 'linkedin' : a.provider
    const extraData = JSON.parse(a.extra_data)
    return new Authentication({
      userId,
      createdAt: user.date_joined,
      type,
      identifier: a.uid,
      token: extraData.access_token,
    }).save(null).catch(error => {
      if (error.constraint != 'authentication_userid_type_unique') throw error
      return true
    })
  }))

let i = 1
const migrate = toStream.sink(pull(
  pullPromise.through(user =>
    Promise.all([auth(user.id), application(user.id)])
      .then(([auth, applications]) =>
        createUser(user)
          .then(newUser => {
            createPasswordAuth(newUser.id, user)
            return newUser
          })
          .catch(() => getExistingUser(user))
          .then(({id}) =>
            Promise.all([
              applications.length === 1 && createApplication(id, user, applications[0]),
              createTokenAuthentications(id, user, auth)
            ])
          )
      )
  ),
  pull.drain(user => {
    console.log(i++)
  })
))

const query = oldDb.select().from('auth_user')
query.pipe(migrate)
