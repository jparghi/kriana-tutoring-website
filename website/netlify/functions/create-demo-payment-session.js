// Creates a Stripe Checkout Session for the $10 Young Engineers Demo
// Registration flow. Fail-closed on ENABLE_DEMO_PAYMENTS, same as
// submit-demo-registration.js. Price/currency are always resolved from
// getDemoPricing() — never trusted from the request body.
import Stripe from 'stripe'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'
import { getDemoPricing } from '../../lib/robotics-packages.js'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}
const MAX_BODY_BYTES = 4 * 1024

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) }
}

function demoPaymentsEnabled() {
  return process.env.ENABLE_DEMO_PAYMENTS === 'true'
}

function siteUrl() {
  return process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://krianatutoring.com'
}

// Deterministic given the same demoRegistrationId — exported so tests can
// assert the idempotency key without mocking the Stripe SDK. See the
// idempotencyKey usage below for why a deterministic key (rather than a
// retrieve-then-create round trip) is sufficient to make retries safe.
export function idempotencyKeyForDemoRegistration(demoRegistrationId) {
  return `demo-session-${demoRegistrationId}`
}

export const handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...JSON_HEADERS, Allow: 'POST' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  if (!demoPaymentsEnabled()) {
    return json(503, { error: 'Demo registration is temporarily unavailable.' })
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

  const demoRegistrationId = typeof body?.demoRegistrationId === 'string' ? body.demoRegistrationId.trim() : ''
  if (!demoRegistrationId || demoRegistrationId.includes('/')) {
    return json(400, { error: 'A demo registration reference is required.' })
  }

  try {
    const db = getAdminDb()
    const ref = db.collection('demoRegistrations').doc(demoRegistrationId)
    const snapshot = await ref.get()
    if (!snapshot.exists) {
      return json(404, { error: 'Demo registration not found.' })
    }
    const registration = snapshot.data()

    // Never create a second live session for a registration that has already
    // moved past 'pending' (paid, failed, canceled, refunded).
    if (registration.paymentStatus !== 'pending') {
      return json(409, { error: 'This demo registration already has a payment result recorded.' })
    }

    const { priceCents, currency } = getDemoPricing()
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const base = siteUrl()

    // Idempotency choice: we pass a deterministic idempotencyKey
    // (`demo-session-${demoRegistrationId}`) to Stripe's API rather than
    // first calling sessions.retrieve() to check for a live prior session.
    // Stripe's idempotency-key mechanism already guarantees that repeated
    // calls with the same key and the same request parameters, within
    // Stripe's idempotency window, return the SAME session object rather
    // than creating a second one — so a naive client retry (e.g. a double
    // click, or a network retry) can never double-create a Checkout
    // Session. This is simpler than a retrieve-then-create-if-missing
    // round trip and has no correctness gap for that scenario.
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: priceCents,
          product_data: { name: '$10 Young Engineers Demo Class' },
        },
        quantity: 1,
      }],
      metadata: { demoRegistrationId },
      // Also stamped onto the resulting PaymentIntent so demo-payment-webhook.js
      // can resolve demoRegistrationId from payment_intent.* events too, not
      // just checkout.session.* events (Checkout Session metadata is not
      // automatically copied to its PaymentIntent unless set explicitly here).
      payment_intent_data: { metadata: { demoRegistrationId } },
      success_url: `${base}/booking/demo-confirmed?demoRegistrationId=${encodeURIComponent(demoRegistrationId)}&programId=${encodeURIComponent(registration.demoProgramId)}`,
      cancel_url: `${base}/booking/${encodeURIComponent(registration.demoProgramId)}/register?offeringId=${encodeURIComponent(registration.demoOfferingId)}&registrationType=demo`,
    }, { idempotencyKey: idempotencyKeyForDemoRegistration(demoRegistrationId) })

    await ref.update({ paymentSessionId: session.id, updatedAt: FieldValue.serverTimestamp() })

    return json(201, { url: session.url })
  } catch (error) {
    console.error('create-demo-payment-session failed:', error)
    return json(500, { error: 'We could not start your $10 demo payment. Please try again or contact Kriana Tutoring.' })
  }
}
