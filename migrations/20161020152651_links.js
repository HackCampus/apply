exports.up = function(knex, Promise) {
  return knex.schema.table('applications', function (t) {
    t.string('cvUrl')
    t.string('websiteUrl')
    t.string('linkedinUrl')
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.table('applications', function (t) {
    t.dropColumn('cvUrl')
    t.dropColumn('websiteUrl')
    t.dropColumn('linkedinUrl')
  })
}
