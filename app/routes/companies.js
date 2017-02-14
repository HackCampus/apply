module.exports = models => {
  function routes (app) {
    app.get('/companies', handleGetCompanies)
  }

  function handleGetCompanies (req, res, handleError) {
    res.status(401)
    res.end()
  }

  return {
    routes,
  }
}
