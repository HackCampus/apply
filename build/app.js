const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const router = require('express-promise-router')();
const http = require('http');
const path = require('path');

const env = require('./env');
const logger = require('./lib/logger');

const errorHandler = require('./middlewares/errors');
const forceHttps = require('./middlewares/forceHttps');
const limitToMatchers = require('./middlewares/limitToMatchers');
const requestLogger = require('./middlewares/requestLogger');
const session = require('./middlewares/session');

const app = express();
app.use(router);

router.use(forceHttps);

// router.use(requestLogger(logger))
router.use(session());
router.use((req, res, next) => {
  if (!req.session) {
    logger.fatal('session not found. is redis started?');
  }
  next();
});
router.use(bodyParser.json());
router.use(cookieParser());
router.use('/static', express.static(path.join(__dirname, 'client')));
app.disable('x-powered-by');

// routes
const models = require('./database');

// Needs to come before all other routes, as authorized middleware depends on these.
const auth = require('./routes/auth')(models);
auth.routes(router);

const application = require('./routes/application')(models);
application.routes(router);

const companies = require('./routes/companies')(models);
companies.routes(router);

const user = require('./routes/user')(models);
user.routes(router);

const match = require('./routes/match')(models);
match.routes(router);

const profile = require('./routes/profile')(models);
profile.routes(router);

// client-side app routes
const spa = require('./templates/spa');
const clientApp = appName => (req, res) => res.send(spa(appName));
router.get('/', clientApp('apply'));
router.get('/shortlisted', clientApp('companies'));
router.get('/match', limitToMatchers(clientApp('login')), clientApp('match'));
router.get('/match/application/:id', limitToMatchers(clientApp('login')), clientApp('matchDetail'));

// error handling & fallback route.
router.use(errorHandler);
router.use((req, res, handleError) => {
  res.status(404).end();
});

const server = http.createServer(app);

module.exports = function (port) {
  server.listen(port, () => {
    logger.info({ port }, 'started');
  });
  return server;
};