exports.up = function(knex, Promise) {
  return knex.schema.createTable('techPreferences', function (t) {
    t.increments('id').unsigned().primary()
    t.dateTime('createdAt').notNull().defaultsTo(knex.fn.now());

    t.integer('applicationId')
      .unsigned()
      .notNull()
      .references('id')
      .inTable('applications')
      .onDelete('cascade')

    t.string('technology')
    t.integer('preference')
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('techPreferences')
}
