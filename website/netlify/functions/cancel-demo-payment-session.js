// Called when a parent comes back from Stripe Checkout without paying (the
// session's cancel_url lands on the register page with ?cancelledPayment=<id>).
// Expires the still-open Checkout Session — so it can no longer be paid —
// and only then releases the registration right away: seat, credit and the
// child's eligibility lock. Otherwise the family would be locked out of
// re-registering until the session expired on its own (up to ~40 minutes).
//
// Only ever touches a card registration that is still unpaid. If Stripe says
// the session completed (paid in another tab), nothing is released.
// Not gated on ENABLE_CARD_PAYMENTS, so a rollback never strands a hold.
import Stripe from 'stripe'
import { getAdminDb } from './_lib/firebase-admin.js'
import { afterDemoPaymentOutcome, releaseUnpaidRegistrationInTx } from './demo-payment-webhook.js'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) }
}

/**
 * Exported for tests: `stripe` only needs checkout.sessions.retrieve/expire.
 * Resolves to { released, paid? }.
 */
export async function cancelUnpaidCardRegistration(db, stripe, demoRegistrationId) {
  const ref = db.collection('demoRegistrations').doc(demoRegistrationId)
  const snapshot = await ref.get()
  if (!snapshot.exists) return { released: false }
  const registration = snapshot.data()
  if (registration.paymentProvider !== 'stripe' || registration.paymentStatus !== 'pending' || registration.demoStatus !== 'registered') {
    return { released: false, paid: registration.paymentStatus === 'paid' }
  }

  if (registration.paymentSessionId) {
    let session = await stripe.checkout.sessions.retrieve(registration.paymentSessionId)
    if (session.status === 'complete') return { released: false, paid: true }
    if (session.status === 'open') {
      try {
        session = await stripe.checkout.sessions.expire(registration.paymentSessionId)
      } catch (error) {
        // Lost a race with a payment finishing — re-check before releasing.
        session = await stripe.checkout.sessions.retrieve(registration.paymentSessionId)
        if (session.status !== 'expired') return { released: false, paid: session.status === 'complete' }
      }
    }
  }

  const outcome = await db.runTransaction(tx =>
    releaseUnpaidRegistrationInTx(tx, db, demoRegistrationId, 'canceled', 'Parent left card checkout without paying'),
  )
  if (outcome) await afterDemoPaymentOutcome(db, outcome)
  return { released: Boolean(outcome) }
}

export const handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...JSON_HEADERS, Allow: 'POST' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }
  if (process.env.ENABLE_DEMO_PAYMENTS !== 'true' || !process.env.STRIPE_SECRET_KEY) {
    return json(503, { error: 'Unavailable.' })
  }
  if (!event.body || Buffer.byteLength(event.body, 'utf8') > 1024) {
    return json(413, { error: 'Request body is empty or too large.' })
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return json(400, { error: 'Invalid JSON.' })
  }
  const demoRegistrationId = typeof body?.demoRegistrationId === 'string' ? body.demoRegistrationId.trim() : ''
  if (!demoRegistrationId || demoRegistrationId.includes('/') || demoRegistrationId.length > 150) {
    return json(400, { error: 'A registration reference is required.' })
  }

  try {
    const result = await cancelUnpaidCardRegistration(getAdminDb(), new Stripe(process.env.STRIPE_SECRET_KEY), demoRegistrationId)
    return json(200, result)
  } catch (error) {
    console.error('cancel-demo-payment-session failed:', error)
    return json(500, { error: 'internal error' })
  }
}
