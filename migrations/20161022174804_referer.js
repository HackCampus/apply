exports.up = function(knex, Promise) {
  return knex.schema.table('applications', function (t) {
    t.string('referer')
    t.string('refererDetail')
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.table('applications', function (t) {
    t.dropColumn('referer')
    t.dropColumn('refererDetail')
  })
}
