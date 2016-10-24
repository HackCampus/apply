exports.up = function(knex, Promise) {
  return knex.schema.createTable('authentication', function (t) {
    t.increments('id').unsigned().primary()
    t.dateTime('createdAt').notNull().defaultsTo(knex.fn.now())
		t.dateTime('updatedAt').nullable()

    t.string('type').notNull()
    t.string('identifier').nullable()
    t.string('token').notNull()
    t.integer('userId')
      .unsigned()
      .notNull()
      .references('id')
      .inTable('users')
      .onDelete('cascade')

    // each user should only have one connected account per provider
    t.unique(['userId', 'type'])
    // each provider account should not be associated to more than one user
    t.unique(['type', 'identifier'])
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('authentication')
};
