// Server-only (uses node:crypto) — never import this from a client
// component. Split out of lib/demo-eligibility.js specifically so that
// file stays safe to import from browser bundles (e.g.
// app/booking/[programId]/page.tsx uses DEMO_ELIGIBLE_PROGRAM_IDS /
// isDemoEligibleProgramId from there); pulling node:crypto into that module
// broke the Next.js client build.
import crypto from 'node:crypto'

function normalizeForHash(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '')
}

// Shared by submit-demo-registration.js (writes demoEligibilityLocks /
// demoCredits) and submit-enrollment-request.js's additive automatic
// credit-application step (reads demoCredits by this same hash) — kept in
// this dependency-free lib module, rather than defined in either Netlify
// function, specifically so neither function needs to import the other
// (which would create a circular import between the two submission
// endpoints). Fails closed: a missing/short salt throws rather than
// silently skipping the one-time-offer uniqueness check, mirroring
// ENROLLMENT_RATE_LIMIT_SALT validation in enforceRateLimit.
export function computeChildEligibilityKeyHash(registration) {
  const salt = process.env.DEMO_ELIGIBILITY_KEY_SALT
  if (!salt || salt.length < 32) {
    throw new Error('DEMO_ELIGIBILITY_KEY_SALT must be configured with at least 32 characters')
  }
  const normalizedChildName = normalizeForHash(registration.childName)
  const normalizedParentEmail = normalizeForHash(registration.parentEmail)
  const normalizedParentPhoneDigitsOnly = digitsOnly(registration.parentPhone)
  return crypto.createHmac('sha256', salt)
    .update(`${normalizedChildName}|${normalizedParentEmail}|${normalizedParentPhoneDigitsOnly}`)
    .digest('hex')
}
