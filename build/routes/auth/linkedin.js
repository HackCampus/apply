const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

const env = require('../../env');

const setReturnTo = require('./setReturnTo');
const verify = require('./oauthVerifyCallback');

module.exports = (passport, app) => {
  passport.use(new LinkedInStrategy({
    clientID: env.linkedin.clientId,
    clientSecret: env.linkedin.clientSecret,
    callbackURL: `${env.host}/auth/linkedin/callback`,
    scope: env.linkedin.scope,
    passReqToCallback: true,
    state: true // required by linkedin, see https://github.com/auth0/passport-linkedin-oauth2#auto-handle-state-param
  }, verify('linkedin')));

  app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/auth/error'
  }));

  app.get('/auth/linkedin', setReturnTo, passport.authenticate('linkedin'));
  app.get('/connect/linkedin', setReturnTo, passport.authorize('linkedin'));
};