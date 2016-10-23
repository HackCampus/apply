exports.up = function (knex, Promise) {
  return knex.schema.createTable('applications', function (t) {
    t.increments('id').unsigned().primary()
    t.dateTime('createdAt').notNull().defaultsTo(knex.fn.now())
    t.dateTime('updatedAt').nullable()
    t.dateTime('finishedAt').nullable()

    t.integer('userId')
      .unsigned()
      .notNull()
      .references('id')
      .inTable('users')
      .onDelete('cascade')

    t.string('firstName')
    t.string('lastName')
    t.string('contactEmail')
    t.enum('gender', ['male', 'female', 'other'])
    t.date('dateOfBirth')
    t.string('university')
    t.string('otherUniversity')
    t.string('courseName')
    t.string('courseType')
    t.string('otherCourseType')
    t.string('yearOfStudy')
    t.string('otherYearOfStudy')
    t.string('graduationYear')
    t.string('otherGraduationYear')

    t.string('cvUrl')
    t.string('websiteUrl')

    t.string('referer')
    t.string('refererDetail')

    t.text('bestProject')
    t.text('mostExcitingTechnology')
    t.text('applicationDesign')
    t.text('codeReview')
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('applications')
}
