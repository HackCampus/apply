const authorized = require('../middlewares/authorized')
const {User} = require('../models')

module.exports = function (app) {
  app.get('/me', authorized, (req, res) => {
    User.where({id: req.user.id}, {withRelated: ['authentication']}).fetch()
    .then(user => {
      user.related('authentication').fetch({columns: ['type']})
      .then(authMethods => {
        const connectedAccounts = {}
        authMethods.pluck('type').forEach(t => {
          connectedAccounts[t] = true
        })
        res.json({
          id: user.id,
          email: user.get('email'),
          connectedAccounts,
        })
      })
    })
  })

  app.get('/signout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
  })
}
