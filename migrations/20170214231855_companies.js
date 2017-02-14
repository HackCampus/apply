
exports.up = function(knex, Promise) {
  return knex.schema.createTable('companies', function (t) {
    t.increments('id').unsigned().primary()
    t.string('name').notNull()
    t.unique('name')
    t.string('website')
    t.text('description')
    // actually a JSON array, but somewhere along the line of the bookshelf->knex->node-pg->postgres stack of cards things get lost in translation.
    t.text('stack')
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('companies')
};
