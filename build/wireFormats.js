const values = require('object.values');
const extend = require('xtend');

const technologies = require('./technologies');
const universities = require('./universities');
const applicationEvents = require('./database/models/applicationEvents');
const applicationStages = require('./database/models/applicationStages');

const authentication = {
  type: 'object',
  properties: {
    type: { enum: ['password', 'github'] },
    identifier: { type: 'string' },
    token: { type: 'string' }
  },
  required: ['type', 'token']
};

const password = { type: 'string', minLength: 6, maxLength: 72 };

const register = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password
  },
  required: ['email', 'password']
};

const personalDetails = {
  type: 'object',
  properties: {
    firstName: { type: 'string', minLength: 1 },
    lastName: { type: 'string', minLength: 1 },
    contactEmail: { type: 'string', format: 'email' },
    gender: { enum: ['male', 'female', 'other'] },
    dateOfBirth: { type: 'string', format: 'date' },
    university: { enum: ['other (eg. international)'].concat(universities) },
    otherUniversity: { type: 'string' },
    courseName: { type: 'string', minLength: 1 },
    courseType: { enum: ['under-graduate', 'graduate', 'other'] },
    otherCourseType: { type: 'string' },
    yearOfStudy: { enum: ['1', '2', '3', '4', '5', 'other'] },
    otherYearOfStudy: { type: 'string' },
    graduationYear: { enum: ['2017', '2018', '2019', '2020', '2021', 'other'] },
    otherGraduationYear: { type: 'string' },
    cvUrl: { type: 'string', format: 'uri' },
    websiteUrl: { type: 'string' },
    referer: { enum: ['friend', 'hackathon', 'campus event', 'Facebook', 'other'] },
    refererDetail: { type: 'string' }
  }
};

const optionalFields = {
  otherUniversity: true,
  otherCourseType: true,
  otherYearOfStudy: true,
  otherGraduationYear: true,
  websiteUrl: true,
  refererDetail: true
};

const questions = {
  type: 'object',
  properties: {
    bestProject: { type: 'string' },
    mostExcitingTechnology: { type: 'string' },
    implementation: { type: 'string' },
    codeReview: { type: 'string' },
    perfectRole: { type: 'string' }
  }
};

const application = {
  type: 'object',
  properties: extend(personalDetails.properties, questions.properties)
};

const acceptableTechPreferences = {};
technologies.forEach(tech => {
  acceptableTechPreferences[tech] = { enum: [0, 1, 2, 3] };
});

const techPreferences = {
  type: 'object',
  properties: acceptableTechPreferences,
  additionalProperties: false
};

const applicationEventTypes = values(applicationEvents).map(({ type }) => type);

const applicationEvent = {
  type: 'object',
  properties: {
    type: {
      enum: applicationEventTypes
    },
    payload: {
      type: 'object'
    }
  },
  required: ['type']
};

const companyPreferences = {
  type: 'object',
  properties: {
    firstChoice: {
      type: 'string'
    },
    secondChoice: {
      type: 'string'
    },
    thirdChoice: {
      type: 'string'
    },
    comment: {
      type: 'string'
    }
  },
  required: ['firstChoice', 'secondChoice', 'thirdChoice', 'comment']
};

module.exports = {
  application,
  applicationEvent,
  applicationEvents,
  applicationStages,
  authentication,
  companyPreferences,
  optionalFields,
  password,
  personalDetails,
  questions,
  register,
  techPreferences
};