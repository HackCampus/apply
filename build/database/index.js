const Knex = require('knex');

const knexConfig = require('./_knexConfig');
const knexInstance = Knex(knexConfig);
const models = require('./models')(knexInstance);

module.exports = models;