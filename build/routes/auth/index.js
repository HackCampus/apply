const passport = require('passport');

const github = require('./github');
const linkedin = require('./linkedin');
const password = require('./password');

module.exports = models => {
  const { User } = models;

  function routes(app) {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await User.fetchById(id);
        done(null, user);
      } catch (error) {
        done(error);
      }
    });

    app.get('/auth/error', (req, res) => {
      res.send('Authentication failed. If you tried to connect an account, check that you haven\'t already started another application with that account.');
    });

    github(passport, app);
    linkedin(passport, app);
    password(passport, app);
  }

  return {
    routes
  };
};