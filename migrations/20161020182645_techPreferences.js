exports.up = function(knex, Promise) {
  return knex.schema.createTable('techpreferences', function (t) {
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

    t.unique(['applicationId', 'technology'])
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('techpreferences')
}
