exports.up = function(knex, Promise) {
  return knex.schema.table('applications', function (t) {
    t.text('bestProject')
    t.text('mostExcitingTechnology')
    t.text('applicationDesign')
    t.text('codeReview')
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.table('applications', function (t) {
    t.dropColumn('bestProject')
    t.dropColumn('mostExcitingTechnology')
    t.dropColumn('applicationDesign')
    t.dropColumn('codeReview')
  })
}
