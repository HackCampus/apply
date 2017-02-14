module.exports = function (bookshelf) {
  const Authentication = bookshelf.Model.extend({
    tableName: 'authentication',
    hasTimeStamps: ['createdAt', 'updatedAt'],

    user: function () {
      return this.belongsTo(User, 'userId')
    },
  })

  const Application = bookshelf.Model.extend({
    tableName: 'applications',
    hasTimeStamps: ['createdAt', 'updatedAt'],

    user: function () {
      return this.belongsTo(User, 'userId')
    },
    techPreferences: function () {
      return this.hasMany(TechPreference, 'applicationId')
    },
    events: function () {
      return this.hasMany(ApplicationEvent, 'applicationId')
    }
  })

  const ApplicationEvent = bookshelf.Model.extend({
    tableName: 'applicationevents',
    hasTimeStamps: ['ts'],

    actor: function () {
      return this.belongsTo(User, 'actorId')
    },
    application: function () {
      return this.belongsTo(Application, 'applicationId')
    }
  })

  const Company = bookshelf.Model.extend({
    tableName: 'companies',
    idAttribute: 'name',
  })

  const TechPreference = bookshelf.Model.extend({
    tableName: 'techpreferences',
    hasTimeStamps: ['createdAt'],

    application: function () {
      return this.belongsTo(Application, 'applicationId')
    },
  })

  const User = bookshelf.Model.extend({
    tableName: 'users',
    hasTimeStamps: ['createdAt', 'updatedAt'],

    // relations
    authentication () {
      return this.hasMany(Authentication, 'userId')
    },
    application () {
      return this.hasMany(Application, 'userId')
    },
    applicationEvents () {
      return this.hasMany(ApplicationEvent, 'actorId')
    },
  })

  return {
    bookshelf, // needed for stuff like `transaction`
    Application,
    ApplicationEvent,
    Company,
    Authentication,
    TechPreference,
    User,
  }
}
