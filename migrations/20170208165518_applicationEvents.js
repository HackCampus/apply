
exports.up = function(knex, Promise) {
  return knex.schema.createTable('applicationevents', function (t) {
    t.increments('id').unsigned().primary()

    t.dateTime('ts').notNull().defaultsTo(knex.fn.now())

    t.string('type').notNull()

    t.integer('actorId')
      .notNull()
      .references('id')
      .inTable('users')

    t.integer('applicationId')
      .unsigned()
      .notNull()
      .references('id')
      .inTable('applications')

    t.json('payload')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('applicationevents')
};
