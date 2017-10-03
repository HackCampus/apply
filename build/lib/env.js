function env(varName) {
  const value = process.env[varName];
  if (value == null) console.warn(`warning: expected environment variable ${varName} to be set.`);
  return value;
}

function envNumber(varName) {
  const stringValue = env(varName);
  if (stringValue == null) {
    return null;
  }
  const number = Number.parseInt(stringValue, 10);
  if (Number.isNaN(number)) {
    console.warn(`warning: env variable ${varName} should be a number, got '${stringValue}' instead.`);
    return stringValue;
  }
  return number;
}

module.exports = {
  env,
  envNumber
};