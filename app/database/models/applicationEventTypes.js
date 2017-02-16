const keyMirror = require('keymirror')

module.exports = {
  // vetting
  rejected: 'rejected',
  shortlisted: 'shortlisted',
  shortlistedVeryStrong: 'shortlisted (very strong)',

  // ready to match
  gaveCompanyPreferences: 'gave company preferences',
  madeMatchSuggestion: 'made match suggestion',
  gavePublicMatcherComment: 'gave a (public) matcher comment',

  // matching
  sentToCompany: 'sent to company',
  arrangedInterviewWithCompany: 'arranged an interview with company',

  // offer stage
  companyMadeOffer: 'given an offer by company',
  acceptedOffer: 'accepted offer',
  sentContract: 'got sent contract',

  // in
  signedContract: 'signed contract',
  finalised: 'is in the programme',

  // out
  companyRejected: 'was rejected by company',
  applicantRejected: 'found another opportunity',
}
