module.exports = {
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'hackcampus',
    password: 'hackcampus',
    database: 'hackcampus',
    charset: 'utf8',
  },
  migrations: {
    tableName: 'migrations',
  },
}
