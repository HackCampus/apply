exports.up = function(knex, Promise) {
  return knex.schema.createTable('authentication', function (t) {
    t.increments('id').unsigned().primary()
    t.dateTime('createdAt').notNull().defaultsTo(knex.fn.now())
		t.dateTime('updatedAt').nullable()

    t.enum('type', ['password']).notNull()
    t.string('identifier').nullable()
    t.string('token').notNull()
    t.integer('userId')
      .unsigned()
      .notNull()
      .references('id')
      .inTable('users')
      .onDelete('cascade')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('authentication')
};
