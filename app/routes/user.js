const authorized = require('../middlewares/authorized')

module.exports = models => {
  const {User} = models

  function routes (app) {
    app.get('/me', authorized, async (req, res) => {
      const user = await User.fetchById(req.user.id)
      const authentications = await user.fetchAuthentications()
      const connectedAccounts = {}
      authentications.forEach(a => {
        connectedAccounts[a.type] = true
      })
      res.json({
        id: user.id,
        email: user.email,
        role: user.role,
        connectedAccounts,
      })
    })

    app.get('/signout', (req, res) => {
      req.session.destroy()
      res.redirect('/')
    })
  }

  return {
    routes,
  }
}
