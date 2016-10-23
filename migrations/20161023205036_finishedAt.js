exports.up = function(knex, Promise) {
  return knex.schema.table('applications', function (t) {
    t.dateTime('finishedAt')
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.table('applications', function (t) {
    t.dropColumn('finishedAt')
  })
}
