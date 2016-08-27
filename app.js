const express = require('express')
const fs = require('fs')
const http = require('http')
const path = require('path')

const port = process.env.PORT || 3000
const app = express()

app.use('/static', express.static(path.join(__dirname, 'build')))

app.get('/~:applicant.json', (req, res) => {
  const {applicant} = req.params
  res.json({name: applicant})
})

app.use(require('./shell'))

const server = http.createServer(app)
server.listen(port, () => { console.log(port) })
