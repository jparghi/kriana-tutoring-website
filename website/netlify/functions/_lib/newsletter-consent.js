// Canonical marketing-consent wording and contact normalization for the
// "Kriana Learning Updates" newsletter.
//
// The consent TEXT is stored verbatim on every contact (see
// marketingContactFromSignup below) so a later copy change never rewrites
// what a parent actually agreed to. That is the whole point of recording
// marketingConsentText rather than a bare `subscribed: true` — under CASL we
// have to be able to show the exact wording and date for any given address.
//
// components/newsletter-form.tsx renders the same string from its own copy of
// this constant. Kept in sync by hand, like the signature/transport blocks
// this repo already duplicates across the website/platform boundary (see
// _lib/demo-email.js's header comment for the same convention).
import crypto from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'

export const NEWSLETTER_CONSENT_VERSION = 'website-newsletter-v1'
export const NEWSLETTER_CONSENT_SOURCE = 'website-newsletter'
export const NEWSLETTER_CONSENT_TEXT =
  "Yes, I'd like to receive learning resources, program updates, upcoming events and promotional emails from Kriana Tutoring. I can unsubscribe at any time."

export const INTEREST_OPTIONS = new Set(['tutoring', 'robotics', 'both'])

/**
 * Normalizes an email for use as an identity. Lowercased and trimmed only —
 * deliberately NOT gmail-style dot/plus stripping, which would merge
 * addresses that are genuinely different mailboxes at most providers and
 * would let one person unsubscribe another.
 */
export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase().slice(0, 254)
}

export function isValidEmail(normalized) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
}

/**
 * Document ID for marketingContacts. A digest of the normalized email makes
 * the write an upsert by construction, so re-submitting the same address can
 * never create a second contact — the same key-as-document-ID idempotency
 * demoEligibilityLocks and demoRequestKeys already use.
 */
export function contactId(normalizedEmail) {
  return crypto.createHash('sha256').update(`contact|${normalizedEmail}`).digest('hex')
}

/** Idempotency key for one signup submission, namespaced away from other flows. */
export function signupIdempotencyDigest(normalizedEmail, clientRequestId) {
  return crypto.createHash('sha256')
    .update(`newsletter|${normalizedEmail}|${clientRequestId}`)
    .digest('hex')
}

/**
 * The unsubscribe token for a contact, DERIVED rather than random.
 *
 * A random token would have to be stored to be reusable, and storing it would
 * defeat the point (F16: a database read must not let anyone unsubscribe
 * somebody else). Deriving it from a server-side secret keeps both
 * properties: only the SHA-256 hash is ever persisted, yet any server holding
 * the secret can recompute the same token later — which is what lets a
 * campaign put a working unsubscribe link in every email months after signup.
 *
 * Deterministic, so links in already-delivered email keep working forever.
 * Rotating MARKETING_UNSUBSCRIBE_SECRET invalidates every outstanding link,
 * so treat it as permanent.
 *
 * Fails closed when unset, matching ENROLLMENT_RATE_LIMIT_SALT.
 */
export function deriveUnsubscribeToken(contactDocId) {
  const secret = process.env.MARKETING_UNSUBSCRIBE_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('MARKETING_UNSUBSCRIBE_SECRET must be configured with at least 32 characters')
  }
  const token = crypto.createHmac('sha256', secret).update(`unsubscribe|${contactDocId}`).digest('base64url')
  return { token, hash: hashUnsubscribeToken(token) }
}

export function hashUnsubscribeToken(token) {
  return crypto.createHash('sha256').update(String(token ?? '')).digest('hex')
}

export function interestFlags(interest) {
  return {
    tutoring: interest === 'tutoring' || interest === 'both',
    robotics: interest === 'robotics' || interest === 'both',
  }
}

function normalizeText(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength)
}

/**
 * Validates a newsletter signup payload. Returns { error } or the normalized
 * request. Mirrors validatePayload in submit-demo-registration.js.
 */
export function validateSignupPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Invalid request body.' }
  }

  const clientRequestId = normalizeText(body.clientRequestId, 100)
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(clientRequestId)) {
    return { error: 'Request identifier is invalid.' }
  }

  const parentName = normalizeText(body.parentName, 120)
  if (parentName.length < 2) return { error: 'Please enter the parent or guardian name.' }

  const emailDisplay = normalizeText(body.email, 254)
  const email = normalizeEmail(emailDisplay)
  if (!isValidEmail(email)) return { error: 'Please enter a valid email address.' }

  const interest = normalizeText(body.interest, 20).toLowerCase()
  if (!INTEREST_OPTIONS.has(interest)) return { error: 'Please choose what you are interested in.' }

  // Consent is required to submit. There is no "sign me up without consent"
  // path: a contact created here always has express consent, which is what
  // makes it eligible to receive campaigns (F6).
  if (body.marketingConsent !== true) {
    return { error: 'Please check the consent box to subscribe.' }
  }

  return { clientRequestId, parentName, emailDisplay, email, interest }
}

/**
 * The fields a fresh, consented signup writes. Split out from the transaction
 * so it can be unit-tested without Firestore.
 */
export function marketingContactFromSignup(request, unsubscribeTokenHash, now = FieldValue.serverTimestamp()) {
  const [firstName, ...rest] = request.parentName.split(/\s+/)
  const consentRecord = {
    consent: true,
    date: now,
    source: NEWSLETTER_CONSENT_SOURCE,
    text: NEWSLETTER_CONSENT_TEXT,
    version: NEWSLETTER_CONSENT_VERSION,
  }

  return {
    email: request.email,
    emailDisplay: request.emailDisplay,
    firstName,
    lastName: rest.length ? rest.join(' ') : null,

    interests: interestFlags(request.interest),
    childGrade: null,
    childAge: null,

    leadSource: NEWSLETTER_CONSENT_SOURCE,
    leadDate: now,

    marketingConsent: true,
    marketingConsentDate: now,
    marketingConsentSource: NEWSLETTER_CONSENT_SOURCE,
    marketingConsentText: NEWSLETTER_CONSENT_TEXT,
    marketingConsentVersion: NEWSLETTER_CONSENT_VERSION,
    consentHistory: [consentRecord],

    status: 'lead',
    sourceRefs: [],

    lastMarketingEmailAt: null,
    unsubscribedAt: null,
    unsubscribeTokenHash,

    createdAt: now,
    updatedAt: now,
  }
}
