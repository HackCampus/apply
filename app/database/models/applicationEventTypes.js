const keyMirror = require('keymirror')

module.exports = {
  finished: 'finished',

  // vetting
  rejected: 'rejected',
  shortlisted: 'shortlisted',

  // matching prep
  gaveCompanyPreferences: 'gave company preferences',
  madeMatchSuggestion: 'made match suggestion',

  // matching in progress
  sentToCompany: 'sent to company',
  arrangedInterviewWithCompany: 'arranged an interview with company',
  companyRejected: 'was rejected by company',
  companyMadeOffer: 'given an offer by company',
  acceptedOffer: 'accepted offer',
  sentContract: 'got sent contract',
  signedContract: 'signed contract',

  // done
  applicantAccepted: 'is in the programme',
  applicantRejected: 'found another opportunity',
}
