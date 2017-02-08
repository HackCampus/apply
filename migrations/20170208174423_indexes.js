
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('applications', function (t) {
      t.index(['id'])
      t.index(['programmeYear'])
      t.index(['userId'])
    }),
    knex.schema.table('users', function (t) {
      // t.index(['email']) // already exists
      t.index(['role'])
    }),
    knex.schema.table('authentication', function (t) {
      t.index(['id'])
      t.index(['userId'])
      t.index(['type'])
    }),
    knex.schema.table('techpreferences', function (t) {
      t.index(['applicationId'])
      t.index(['technology'])
    }),
    knex.schema.table('applicationevents', function (t) {
      t.index(['type'])
      t.index(['actorId'])
      t.index(['applicationId'])
    }),
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('applications', function (t) {
      t.dropIndex(['id'])
      t.dropIndex(['programmeYear'])
      t.dropIndex(['userId'])
    }),
    knex.schema.table('users', function (t) {
      // t.dropIndex(['email'])
      t.dropIndex(['role'])
    }),
    knex.schema.table('authentications', function (t) {
      t.dropIndex(['id'])
      t.dropIndex(['userId'])
      t.dropIndex(['type'])
    }),
    knex.schema.table('techpreferences', function (t) {
      t.dropIndex(['applicationId'])
      t.dropIndex(['technology'])
    }),
    knex.schema.table('applicationevents', function (t) {
      t.dropIndex(['type'])
      t.dropIndex(['actorId'])
      t.dropIndex(['applicationId'])
    }),
  ])
};
