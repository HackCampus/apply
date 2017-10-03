module.exports = {
  AuthenticationTypeError: class AuthenticationTypeError extends Error {},
  AuthenticationNotImplemented: class AuthenticationNotImplemented extends Error {},
  AuthenticationNotFound: class AuthenticationNotFound extends Error {},
  DuplicateKey: class DuplicateKey extends Error {},
  DuplicateEmail: class DuplicateEmail extends Error {},
  NotFound: class NotFound extends Error {},
  ApplicationFinished: class ApplicationFinished extends Error {}
};