const test = require('ava');

const makeModels = require('../database/models');
const { setupDb, teardownDb } = require('./_testDb');

let db, models;
test.before('setup db', async t => {
  const database = await setupDb();
  db = database;
  models = makeModels(database);
  return;
});

test.after.always('teardown db', t => {
  return teardownDb(db);
});

test('Application.create/update', async t => {
  const { Application, User } = models;
  const user = await User.createWithPassword('applicationsane@test.file', 'somepass');
  const application = await Application.create(user.id, { firstName: 'foo', lastName: 'bar', techPreferences: { React: 3, JavaScript: 0 } });
  const applicationJson = await application.materialize();
  t.is(applicationJson.firstName, 'foo');
  t.is(applicationJson.lastName, 'bar');
  t.is(applicationJson.techPreferences.React, 3);
  t.is(applicationJson.techPreferences.JavaScript, 0);
  await application.update({ lastName: 'different', techPreferences: { React: 1 } });
  const applicationJson2 = await application.materialize();
  t.is(applicationJson2.firstName, 'foo');
  t.is(applicationJson2.lastName, 'different');
  t.is(applicationJson2.techPreferences.React, 1);
  t.is(applicationJson2.techPreferences.JavaScript, 0);
});

test('Application.fetchLatest', async t => {
  const { Application, User } = models;
  const user = await User.createWithPassword('applicationsane2@test.file', 'somepass');
  await Application.create(user.id, { programmeYear: 2015 });
  await Application.create(user.id, { firstName: 'blap', programmeYear: 2016, techPreferences: { React: 3 } });
  const application = await Application.fetchLatest(user.id);
  const applicationJson = await application.materialize();
  t.is(applicationJson.programmeYear, 2016);
  t.is(applicationJson.firstName, 'blap');
  t.is(applicationJson.techPreferences.React, 3);
});

test('Application.updateOrRenew - previous application exists', async t => {
  const { Application, User } = models;
  const user = await User.createWithPassword('applicationsane3@test.file', 'somepass');
  await Application.create(user.id, { programmeYear: 2015, firstName: 'name doesnt change' });
  const application = await Application.updateOrRenew(user.id, { lastName: 'does though' });
  const applicationJson = await application.materialize();
  t.is(applicationJson.programmeYear, 2018);
  t.is(applicationJson.firstName, 'name doesnt change');
  t.is(applicationJson.lastName, 'does though');
});