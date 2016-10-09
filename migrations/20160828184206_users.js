exports.up = function(knex, Promise) {
  return knex.schema.createTable('users', function (t) {
    t.increments('id').unsigned().primary()
    t.dateTime('createdAt').notNull().defaultsTo(knex.fn.now());
		t.dateTime('updatedAt').nullable();

    t.string('email').notNull().unique()
    t.index('email')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users')
};
