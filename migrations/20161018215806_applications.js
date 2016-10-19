exports.up = function (knex, Promise) {
  return knex.schema.createTable('applications', function (t) {
    t.increments('id').unsigned().primary()
    t.dateTime('createdAt').notNull().defaultsTo(knex.fn.now())
    t.dateTime('updatedAt').nullable()

    t.integer('userId')
      .unsigned()
      .notNull()
      .references('id')
      .inTable('users')
      .onDelete('cascade')

    t.string('firstName')
    t.string('lastName')
    t.enum('gender', ['male', 'female', 'other'])
    t.date('dateOfBirth')
    t.string('university')
    t.string('courseName')
    t.string('courseType')
    t.string('yearOfStudy')
    t.string('graduationYear')
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('applications')
}
