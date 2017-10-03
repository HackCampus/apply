module.exports = bsModels => {
  // Some model methods take a parameter `transaction`.
  // They should definitely be run in a transaction, but we don't really want
  // to construct that if we're calling those methods externally, as that would
  // expose the bookshelf internals.
  // This method wraps the `next` callback in a transaction if it is not passed
  // as an argument.
  return async function definitelyTransact (transaction, next) {
    if (transaction == null) {
      return bsModels.bookshelf.transaction(async transaction => next(transaction))
    } else {
      return next(transaction)
    }
  }
}
