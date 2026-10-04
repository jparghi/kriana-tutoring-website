// The parent's digital learning-path agreement for Builder and Engineer
// registrations (/robotics/agreement, linked from the portal's "Registration
// Received" email). A lightweight record — typed name plus two checkboxes —
// not a signed contract. Shared by the page and the Netlify function so the
// stored text snapshot is exactly what the parent saw.

// Bump when the terms page changes; each acceptance stores the version.
export const ROBOTICS_TERMS_VERSION = '2026-10-04'

// The Robotics Program & Payment Terms page linked beside the checkbox.
export const ROBOTICS_TERMS_URL = '/robotics/terms'

export const AGREEMENT_COMMITMENT_STATEMENT =
  'I understand that the Builder or Engineer Learning Path is a full program commitment and that installment payments are only a payment schedule, not a month-to-month program.'

export const AGREEMENT_TERMS_STATEMENT = 'I agree to the Robotics Program & Payment Terms.'

/** Validates the parent's submission; returns { error } or { fullName }. */
export function validateAgreementSubmission(body) {
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim().replace(/\s+/g, ' ').slice(0, 120) : ''
  if (fullName.length < 3 || !/\s/.test(fullName)) return { error: 'Please type your full name (first and last).' }
  if (body.commitmentAccepted !== true || body.termsAccepted !== true) {
    return { error: 'Please tick both boxes to accept the agreement.' }
  }
  return { fullName }
}
