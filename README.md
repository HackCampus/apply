# spec

a user should be able to authenticate with email+password or github
a user should not be able to register an account with an email that's already used
a user has a single associated application (or none)
applicant should be able to enter their application
applicant should be able to start application without having registered
'save' should prompt for user details
application should be be associated with a single user
email verification

# random

undo/redo/saved state with hash of url
can do anonymous editing with it

# todo

- [ ] oauth: linkedin, github
- [ ] test in non-es6 env


# fields

## contact details (private)

username
email
password
verified (hidden)

## public profile

first name
last name
gender
date of birth
university
course
year of study: 3 of 4
graduation year
links:
  - website: <a>http://lachenmayer.me</a>
  - github: <a>https://github.com/lachenmayer</a>
  - linkedin: <a>https://www.linkedin.com/in/harrylachenmayer</a>
cv file upload


# inu things

unclear in docs that state is {model, effect}


json patch
https://tools.ietf.org/html/rfc6902

# dev db setup

create role hackcampus with createdb login password 'hackcampus';
create database hackcampus with owner hackcampus;
