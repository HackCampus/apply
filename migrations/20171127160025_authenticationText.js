
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('authentication', function(t) {
    t.text('identifier').alter()
    t.text('token').notNull().alter()
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('authentication', function(t) {
    t.string('identifier').alter()
    t.string('token').notNull().alter()
  })
};
