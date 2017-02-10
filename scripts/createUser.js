const roles = require('../app/roles')
const {Database, User, errors} = require('../app/database')

async function main () {
  const usage = 'node createUser --email <email> --password <password> --role <role>'
  function error () {
    console.error(usage)
    process.exit(1)
  }

  const args = require('minimist')(process.argv.slice(2))
  if (args.email == null) {
    error()
  }
  if (args.password == null) {
    error()
  }
  if (args.role == null) {
    if (roles[args.role] == null) {
      console.error('possible roles:', roles)
    }
    error()
  }

  const {
    email,
    password,
    role,
  } = args
  try {
    const user = await User.createWithPassword(email, password)
    await user.update({role})
    process.exit(0)
  } catch (e) {
    if (e instanceof errors.DuplicateEmail) {
      console.error('user already exists!')
      process.exit(2)
    }
    throw e
  }
}
main()
