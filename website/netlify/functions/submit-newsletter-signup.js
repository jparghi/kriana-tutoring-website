// "Join Kriana Learning Updates" — public newsletter signup endpoint.
//
// Replaces the client-only stub that components/newsletter-form.tsx used to
// be (it showed "Thanks for subscribing!" and discarded the address). Every
// signup here writes a marketingContacts doc carrying an auditable consent
// record: the exact wording shown, its version, the source, and the date.
//
// Follows the same shape as submit-demo-waitlist.js — Firebase Admin write
// only, shared IP rate limit, an idempotency key doc, and a welcome email
// that can fail without failing the request.
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'
import { RequestRejectedError, enforceRateLimit } from './submit-enrollment-request.js'
import {
  NEWSLETTER_CONSENT_SOURCE,
  NEWSLETTER_CONSENT_TEXT,
  NEWSLETTER_CONSENT_VERSION,
  contactId,
  deriveUnsubscribeToken,
  interestFlags,
  marketingContactFromSignup,
  signupIdempotencyDigest,
  validateSignupPayload,
} from './_lib/newsletter-consent.js'
import { sendNewsletterWelcomeEmail } from './_lib/newsletter-email.js'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}
const MAX_BODY_BYTES = 8 * 1024
const IDEMPOTENCY_TTL_MS = 7 * 24 * 60 * 60 * 1000

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) }
}

/**
 * Upserts the contact by email digest, so a parent who submits the footer
 * form three times has exactly one marketingContacts doc.
 *
 * Merge rules, all deliberate:
 *   - interests are UNIONed, never replaced — someone who signed up for
 *     robotics and later for tutoring is interested in both.
 *   - consentHistory is append-only; it is the audit trail.
 *   - a previously unsubscribed contact IS re-subscribed here, because this
 *     path is a fresh, explicit, consented opt-in by the address owner. That
 *     is the ONLY way unsubscribedAt is ever cleared — the F4 import path
 *     must never do it.
 *   - the unsubscribe token is issued once and then kept, so links in
 *     already-delivered emails keep working.
 *
 * Exported for tests.
 */
export async function saveNewsletterContact(db, request) {
  const contactRef = db.collection('marketingContacts').doc(contactId(request.email))
  const requestKeyRef = db.collection('newsletterRequestKeys')
    .doc(signupIdempotencyDigest(request.email, request.clientRequestId))
  // Derived from the contact's document id, so it is the same token every
  // time — the campaign sender recomputes it later to build each recipient's
  // unsubscribe link. Only the hash is stored.
  const issued = deriveUnsubscribeToken(contactRef.id)

  return db.runTransaction(async tx => {
    // Every read before the first write (Firestore transaction rule).
    const requestKey = await tx.get(requestKeyRef)
    if (requestKey.exists) {
      return { duplicate: true, unsubscribeToken: null, alreadySubscribed: true }
    }

    const existing = await tx.get(contactRef)
    const now = FieldValue.serverTimestamp()
    const consentRecord = {
      consent: true,
      // serverTimestamp() is not allowed inside an array element, so consent
      // history entries carry a client-side transaction timestamp. The
      // top-level marketingConsentDate remains a true server timestamp.
      date: Timestamp.now(),
      source: NEWSLETTER_CONSENT_SOURCE,
      text: NEWSLETTER_CONSENT_TEXT,
      version: NEWSLETTER_CONSENT_VERSION,
    }

    if (!existing.exists) {
      const contact = marketingContactFromSignup(request, issued.hash, now)
      contact.consentHistory = [consentRecord]
      tx.create(contactRef, contact)
      tx.set(requestKeyRef, {
        contactId: contactRef.id,
        expiresAt: Timestamp.fromMillis(Date.now() + IDEMPOTENCY_TTL_MS),
        createdAt: now,
      })
      return { duplicate: false, unsubscribeToken: issued.token, alreadySubscribed: false }
    }

    const previous = existing.data()
    const wasSubscribed = previous.marketingConsent === true && !previous.unsubscribedAt
    const flags = interestFlags(request.interest)

    tx.update(contactRef, {
      emailDisplay: previous.emailDisplay || request.emailDisplay,
      firstName: previous.firstName || request.parentName.split(/\s+/)[0],
      interests: {
        tutoring: previous.interests?.tutoring === true || flags.tutoring,
        robotics: previous.interests?.robotics === true || flags.robotics,
      },
      marketingConsent: true,
      marketingConsentDate: now,
      marketingConsentSource: NEWSLETTER_CONSENT_SOURCE,
      marketingConsentText: NEWSLETTER_CONSENT_TEXT,
      marketingConsentVersion: NEWSLETTER_CONSENT_VERSION,
      consentHistory: FieldValue.arrayUnion(consentRecord),
      unsubscribedAt: null,
      unsubscribeTokenHash: issued.hash,
      updatedAt: now,
    })
    tx.set(requestKeyRef, {
      contactId: contactRef.id,
      expiresAt: Timestamp.fromMillis(Date.now() + IDEMPOTENCY_TTL_MS),
      createdAt: now,
    })

    return { duplicate: false, unsubscribeToken: issued.token, alreadySubscribed: wasSubscribed }
  })
}

export const handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...JSON_HEADERS, Allow: 'POST' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  if (!event.body || Buffer.byteLength(event.body, 'utf8') > MAX_BODY_BYTES) {
    return json(413, { error: 'Request body is empty or too large.' })
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return json(400, { error: 'Invalid JSON.' })
  }

  const validated = validateSignupPayload(body)
  if (validated.error) return json(400, { error: validated.error })

  // Each step reports which stage failed. The public message stays generic —
  // `stage` is a bare marker like 'rate-limit', never an internal message —
  // so a signup failure can be diagnosed from the response instead of
  // needing log access.
  let stage = 'init'
  try {
    stage = 'admin-db'
    const db = getAdminDb()

    stage = 'rate-limit'
    if (!await enforceRateLimit(db, event)) {
      return json(429, { error: 'Too many requests. Please wait a few minutes and try again.' })
    }

    stage = 'save-contact'
    const saved = await saveNewsletterContact(db, validated)

    // Only a genuinely new subscription triggers the welcome email — a
    // re-submit by someone already on the list must not re-send it.
    stage = 'welcome-email'
    if (!saved.duplicate && !saved.alreadySubscribed) {
      await sendNewsletterWelcomeEmail({
        parentName: validated.parentName,
        email: validated.emailDisplay,
        interest: validated.interest,
        unsubscribeToken: saved.unsubscribeToken,
      })
    }

    // Deliberately the same response whether this address was new, already
    // subscribed, or a replayed request: the endpoint is public, so telling
    // callers which addresses are on the list would be an enumeration oracle.
    return json(201, { subscribed: true })
  } catch (error) {
    if (error instanceof RequestRejectedError) {
      return json(error.statusCode, { error: error.message })
    }
    console.error(`submit-newsletter-signup failed at stage "${stage}":`, error)
    return json(500, {
      error: 'We could not complete your signup. Please try again or contact Kriana Tutoring.',
      stage,
    })
  }
}
