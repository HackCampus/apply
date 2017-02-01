// usage: node makePassword.js NEWPASSWORD
const hashPassword = require('../app/database/hashPassword')

hashPassword(process.argv[2])
  .then(hash => console.log(hash))
