
exports.up = function(knex, Promise) {
  return knex.schema.table('applications', function (t) {
    t.text('perfectRole')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.table('applications', function (t) {
    t.dropColumn('perfectRole')
  })
};
