// Marketing unsubscribe — public endpoint behind /unsubscribe/[token].
//
// Looks a contact up by the SHA-256 hash of the token from their email. The
// raw token is never stored (see _lib/newsletter-consent.js), so a database
// read can't be used to unsubscribe somebody else.
//
// SCOPE — read this before changing anything here. This endpoint writes to
// marketingContacts and NOTHING else. It must never touch registrations,
// demoRegistrations, waitlist, families or users. Unsubscribing from
// marketing must not stop the transactional email a family has paid for:
// registration confirmations, invoices, booking and demo emails all key off
// those other collections and are unaffected by design.
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'
import { hashUnsubscribeToken } from './_lib/newsletter-consent.js'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}
const MAX_BODY_BYTES = 4 * 1024
const UNSUBSCRIBE_SOURCE = 'website-unsubscribe-link'

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) }
}

/** Tokens are 32 random bytes, base64url-encoded. Reject anything else before touching Firestore. */
export function isWellFormedToken(token) {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{40,120}$/.test(token)
}

/**
 * Suppresses marketing for the contact holding this token. Idempotent: a
 * second click is a no-op that still reports success, because the parent's
 * question ("am I off the list?") has the same answer either way.
 *
 * Returns { matched } — matched:false when no contact holds the token. The
 * caller deliberately does NOT surface that distinction (see the handler).
 *
 * Exported for tests.
 */
export async function suppressMarketingForToken(db, token) {
  const tokenHash = hashUnsubscribeToken(token)
  const matches = await db.collection('marketingContacts')
    .where('unsubscribeTokenHash', '==', tokenHash)
    .limit(1)
    .get()

  if (matches.empty) return { matched: false, alreadyUnsubscribed: false }

  const contactDoc = matches.docs[0]
  if (contactDoc.data().unsubscribedAt) {
    return { matched: true, alreadyUnsubscribed: true }
  }

  await contactDoc.ref.update({
    marketingConsent: false,
    unsubscribedAt: FieldValue.serverTimestamp(),
    // Append-only audit trail: the withdrawal is recorded alongside the
    // original consent rather than overwriting it.
    consentHistory: FieldValue.arrayUnion({
      consent: false,
      date: Timestamp.now(),
      source: UNSUBSCRIBE_SOURCE,
      text: 'Unsubscribed via the link in a Kriana Learning Updates email.',
    }),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return { matched: true, alreadyUnsubscribed: false }
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

  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!isWellFormedToken(token)) {
    // Same generic success as a valid-but-unknown token, so this endpoint
    // can't be used to test whether a token exists.
    return json(200, { unsubscribed: true })
  }

  try {
    const db = getAdminDb()

    // Deliberately NOT behind enforceRateLimit. That bucket is 5 requests per
    // 15 minutes per IP, shared across every submission endpoint in this repo
    // — so a parent who had just registered for a demo could be told to come
    // back later when they tried to unsubscribe, and a household behind one
    // NAT could block each other. Being unable to unsubscribe is a compliance
    // failure, so that trade is not acceptable here.
    //
    // What protects this endpoint instead: the token is 32 random bytes (a
    // 256-bit secret that IS the authorization, so IP limits add nothing
    // against guessing), malformed tokens are rejected above before any read,
    // and a well-formed miss costs exactly one indexed .limit(1) query and no
    // write.
    const result = await suppressMarketingForToken(db, token)
    if (!result.matched) {
      console.warn('process-unsubscribe: no contact matched the supplied token.')
    }

    // Always the same response. An unknown token reports success rather than
    // 404 so the endpoint reveals nothing about which tokens are live.
    return json(200, { unsubscribed: true })
  } catch (error) {
    console.error('process-unsubscribe failed:', error)
    return json(500, { error: 'We could not process your request. Please email info@krianatutoring.com and we will remove you.' })
  }
}
