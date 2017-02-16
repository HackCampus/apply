
exports.up = function(knex, Promise) {
  return knex.schema.table('applications', function (t) {
    t.string('profileToken').unique()
    t.index('profileToken')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.table('applications', function (t) {
    t.dropColumn('profileToken')
    t.dropIndex('profileToken')
  })
};
