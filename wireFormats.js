const universities = require('./universities')
const extend = require('xtend')

const authentication = {
  type: 'object',
  properties: {
    type: {enum: ['password', 'github']},
    identifier: {type: 'string'},
    token: {type: 'string'},
  },
  required: ['type', 'token'],
}

const password = {type: 'string', minLength: 6, maxLength: 72}

const register = {
  type: 'object',
  properties: {
    email: {type: 'string', format: 'email'},
    password,
  },
  required: ['email', 'password'],
}

const personalDetails = {
  type: 'object',
  properties: {
    firstName: {type: 'string'},
    lastName: {type: 'string'},
    contactEmail: {type: 'string', format: 'email'},
    gender: {enum: ['male', 'female', 'other']},
    dateOfBirth: {type: 'string', format: 'date'},
    university: {enum: ['other (eg. international)'].concat(universities)},
    otherUniversity: {type: 'string'},
    courseName: {type: 'string'},
    courseType: {enum: ['under-graduate', 'graduate', 'other']},
    otherCourseType: {type: 'string'},
    yearOfStudy: {enum: ['1', '2', '3', '4', '5', 'other']},
    otherYearOfStudy: {type: 'string'},
    graduationYear: {enum: ['2017', '2018', '2019', '2020', '2021', 'other']},
    otherGraduationYear: {type: 'string'},
  }
}

const application = {
  type: 'object',
  properties: extend(
    personalDetails.properties
  ),
}

module.exports = {
  authentication,
  password,
  register,
  personalDetails,
  application,
}
