const applicationEvent = (type, visibleName, additionalPayloadSchema = {}, affectsStatus = true) =>
  ({
    type,
    visibleName,
    payloadSchema: {
      type: 'object',
      properties: Object.assign({}, {comment: {type: 'string'}}, additionalPayloadSchema),
    },
    affectsStatus,
  })

module.exports = {
  commented: applicationEvent('commented', 'commented', {}, false /* affectsStatus */),

  // vetting
  rejected: applicationEvent('rejected', 'rejected'),
  shortlisted: applicationEvent('shortlisted', 'shortlisted'),
  shortlistedVeryStrong: applicationEvent('shortlistedVeryStrong', 'shortlisted (very strong)'),

  // ready to match
  gaveCompanyPreferences: applicationEvent('gaveCompanyPreferences', 'gave company preferences'),
  madeMatchSuggestion: applicationEvent('madeMatchSuggestion', 'made match suggestion'),
  gavePublicMatcherComment: applicationEvent('gavePublicMatcherComment', 'gave a (public) matcher comment', {}, false /* affectsStatus */),

  // matching
  sentToCompany: applicationEvent('sentToCompany', 'sent to company'),
  arrangedInterviewWithCompany: applicationEvent('arrangedInterviewWithCompany', 'arranged an interview with company'),

  // offer stage
  companyMadeOffer: applicationEvent('companyMadeOffer', 'given an offer by company'),
  acceptedOffer: applicationEvent('acceptedOffer', 'accepted offer'),
  sentContract: applicationEvent('sentContract', 'got sent contract'),

  // in
  signedContract: applicationEvent('signedContract', 'signed contract'),
  finalised: applicationEvent('finalised', 'is in the programme'),

  // out
  companyRejected: applicationEvent('companyRejected', 'was rejected by company'),
  applicantRejected: applicationEvent('applicantRejected', 'found another opportunity'),
}
