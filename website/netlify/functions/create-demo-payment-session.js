// Starts (or resumes) Stripe Checkout for a card-paid /events registration.
// The register form calls this right after submit-demo-registration.js saved
// the registration with paymentProvider 'stripe'.
//
// Fail closed on BOTH ENABLE_DEMO_PAYMENTS and ENABLE_CARD_PAYMENTS. The
// amount is the registration's own stored priceCents/currency (resolved by
// getDemoPricing(offering) at registration time, HST and early bird
// included) — never anything from the request body, and exactly what
// demo-payment-webhook.js checks the paid amount against.
import Stripe from 'stripe'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'
import { cardPaymentsEnabled } from './_lib/card-payments.js'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}
const MAX_BODY_BYTES = 4 * 1024

// Checkout sessions are short-lived so an abandoned one frees its held seat
// quickly (Stripe's minimum is 30 minutes). Time is cut into 10-minute
// windows: within one window every call sends identical parameters under one
// idempotency key, so a double click or network retry returns the SAME
// session instead of creating a second one. expires_at sits 31 minutes past
// the window's end, so it is always 31–41 minutes from now.
const CHECKOUT_WINDOW_MS = 10 * 60 * 1000
const CHECKOUT_LIFETIME_PAST_WINDOW_MS = 31 * 60 * 1000

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) }
}

function demoPaymentsEnabled() {
  return process.env.ENABLE_DEMO_PAYMENTS === 'true'
}

function siteUrl() {
  return process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://krianatutoring.com'
}

export function checkoutWindow(now = Date.now()) {
  const window = Math.floor(now / CHECKOUT_WINDOW_MS)
  const expiresAtMs = (window + 1) * CHECKOUT_WINDOW_MS + CHECKOUT_LIFETIME_PAST_WINDOW_MS
  return { window, expiresAtSeconds: Math.floor(expiresAtMs / 1000) }
}

export function idempotencyKeyForDemoRegistration(demoRegistrationId, window) {
  return `demo-session-${demoRegistrationId}-${window}`
}

function formatCents(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`
}

/** Pure: the Checkout Session parameters for one registration. Exported for tests. */
export function buildCheckoutSessionParams({ demoRegistrationId, registration, base, expiresAtSeconds }) {
  const snapshot = registration.eventSnapshot || {}
  const eventTitle = snapshot.eventTitle || 'Kriana Tutoring event'
  const reference = registration.registrationNumber || demoRegistrationId
  const taxCents = Number(registration.priceTaxCents) || 0
  const metadata = { demoRegistrationId, registrationNumber: reference }

  const successParams = new URLSearchParams({
    demoRegistrationId,
    programId: registration.demoProgramId || '',
    reference,
    eventTitle: snapshot.eventTitle || '',
    eventType: snapshot.eventType || '',
    amountCents: String(registration.priceCents),
    currency: registration.currency || 'CAD',
    credit: registration.demoCreditEnabled === false ? '0' : '1',
  })
  const cancelParams = new URLSearchParams({
    offeringId: registration.demoOfferingId || '',
    registrationType: 'demo',
    cancelledPayment: demoRegistrationId,
  })

  return {
    mode: 'payment',
    // Card only (Apple Pay / Google Pay are card wallets): settles
    // immediately, so checkout.session.completed always means paid.
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: String(registration.currency || 'CAD').toLowerCase(),
        unit_amount: registration.priceCents,
        product_data: {
          name: `${eventTitle} — ${registration.childName}`,
          description: taxCents > 0
            ? `Booking ${reference} · includes ${formatCents(taxCents)} HST`
            : `Booking ${reference}`,
        },
      },
      quantity: 1,
    }],
    customer_email: registration.parentEmail || undefined,
    client_reference_id: reference,
    metadata,
    // Also stamped onto the PaymentIntent so demo-payment-webhook.js can
    // resolve the registration from payment_intent.* events too. `checkout`
    // tells it a failed attempt happened inside Checkout, where the parent
    // can simply try another card.
    payment_intent_data: {
      metadata: { ...metadata, checkout: 'true' },
      description: `${eventTitle} — ${registration.childName} (${reference})`,
    },
    expires_at: expiresAtSeconds,
    success_url: `${base}/booking/demo-confirmed?${successParams.toString()}`,
    cancel_url: `${base}/booking/${encodeURIComponent(registration.demoProgramId || '')}/register?${cancelParams.toString()}`,
  }
}

/** Why this registration can't (or can) go to Checkout. Exported for tests. */
export function checkoutBlocker(registration) {
  if (registration.paymentProvider !== 'stripe') return { status: 409, error: 'This registration is paid by e-Transfer, not by card.' }
  if (registration.paymentStatus === 'paid') return { status: 409, error: 'This registration is already paid.', paid: true }
  if (registration.paymentStatus !== 'pending' || registration.demoStatus !== 'registered') {
    return { status: 409, error: 'This registration is no longer waiting for payment. Please register again.' }
  }
  if (!Number.isSafeInteger(registration.priceCents) || registration.priceCents <= 0) {
    return { status: 409, error: 'This registration has no amount to pay.' }
  }
  return null
}

export const handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...JSON_HEADERS, Allow: 'POST' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  if (!demoPaymentsEnabled() || !cardPaymentsEnabled()) {
    return json(503, { error: 'Card payment is temporarily unavailable.' })
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('create-demo-payment-session: STRIPE_SECRET_KEY is not set')
    return json(503, { error: 'Card payment is temporarily unavailable.' })
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
  if (!demoRegistrationId || demoRegistrationId.includes('/') || demoRegistrationId.length > 150) {
    return json(400, { error: 'A registration reference is required.' })
  }

  try {
    const db = getAdminDb()
    const ref = db.collection('demoRegistrations').doc(demoRegistrationId)
    const snapshot = await ref.get()
    if (!snapshot.exists) {
      return json(404, { error: 'Registration not found.' })
    }
    const registration = snapshot.data()

    const blocker = checkoutBlocker(registration)
    if (blocker) return json(blocker.status, { error: blocker.error, paid: Boolean(blocker.paid) })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Resume the session already started for this registration when it's
    // still open (e.g. the parent pressed Back and Register again).
    if (registration.paymentSessionId) {
      const existing = await stripe.checkout.sessions.retrieve(registration.paymentSessionId).catch(() => null)
      if (existing?.status === 'open' && existing.url) return json(200, { url: existing.url })
      if (existing?.status === 'complete') return json(409, { error: 'This registration is already paid.', paid: true })
      // Expired: the webhook releases the registration; the parent registers again.
      if (existing?.status === 'expired') {
        return json(409, { error: 'This payment page expired and your spot was released. Please register again.' })
      }
    }

    const { window, expiresAtSeconds } = checkoutWindow()
    const session = await stripe.checkout.sessions.create(
      buildCheckoutSessionParams({ demoRegistrationId, registration, base: siteUrl(), expiresAtSeconds }),
      { idempotencyKey: idempotencyKeyForDemoRegistration(demoRegistrationId, window) },
    )

    await ref.update({ paymentSessionId: session.id, updatedAt: FieldValue.serverTimestamp() })

    return json(201, { url: session.url })
  } catch (error) {
    console.error('create-demo-payment-session failed:', error)
    return json(500, { error: 'We could not open the card payment page. Please try again, or call or text 613-400-6921.' })
  }
}
