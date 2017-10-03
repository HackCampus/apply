const jsonSchema = require('jsonschema');

module.exports = (value, schema) => jsonSchema.validate(value, schema).errors;