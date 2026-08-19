// Stripe webhook receiver for the $10 Young Engineers Demo Registration flow.
//
// Structured in two layers on purpose:
//   1. `reconcileDemoWebhookEvent` — pure(ish) reconciliation logic, given an
//      already-verified Stripe event object and an Admin Firestore db. Fully
//      unit-testable without needing a real Stripe-signed payload.
//   2. `handler` — the Netlify Function glue: fail-closed flag check, raw-body
//      signature verification via stripe.webhooks.constructEvent, then a call
//      into (1).
//
// Eligibility-lock lifecycle policy implemented here (see also
// submit-demo-registration.js and docs/stripe-integration.md):
//   - Demo `registered` (pending OR paid, not yet attended) -> lock stays.
//   - Demo `attended` -> lock stays permanently. This file never sets
//     `attended` and must never delete a lock for one.
//   - Demo `no_show` -> lock stays permanently. This file never sets
//     `no_show` and must never delete a lock for one.
//   - Demo `cancelled` (payment failure/expiry, handled here) -> DELETE the
//     lock so the family can retry.
import Stripe from 'stripe'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'

function demoPaymentsEnabled() {
  return process.env.ENABLE_DEMO_PAYMENTS === 'true'
}

function eventAmountAndCurrency(stripeEvent) {
  const obj = stripeEvent.data.object
  if (stripeEvent.type.startsWith('checkout.session')) {
    return { amountCents: obj.amount_total, currency: String(obj.currency || '').toUpperCase() }
  }
  if (stripeEvent.type.startsWith('payment_intent')) {
    return { amountCents: obj.amount, currency: String(obj.currency || '').toUpperCase() }
  }
  return { amountCents: null, currency: null }
}

function demoRegistrationIdFromEvent(stripeEvent) {
  return stripeEvent.data.object?.metadata?.demoRegistrationId || null
}

async function releaseHeldSeat(tx, db, offeringId) {
  if (!offeringId) return
  tx.update(db.collection('programOfferings').doc(offeringId), {
    heldCount: FieldValue.increment(-1),
    updatedAt: FieldValue.serverTimestamp(),
  })
}

async function confirmHeldSeat(tx, db, offeringId) {
  if (!offeringId) return
  tx.update(db.collection('programOfferings').doc(offeringId), {
    heldCount: FieldValue.increment(-1),
    confirmedCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  })
}

async function handlePaymentSucceeded(tx, db, stripeEvent) {
  const demoRegistrationId = demoRegistrationIdFromEvent(stripeEvent)
  if (!demoRegistrationId) return
  const ref = db.collection('demoRegistrations').doc(demoRegistrationId)
  const snap = await tx.get(ref)
  if (!snap.exists) return
  const registration = snap.data()

  // Defense in depth against a tampered event, even though Stripe signs
  // these payloads: the amount/currency on the wire must match what we
  // recorded when the registration was created.
  const { amountCents, currency } = eventAmountAndCurrency(stripeEvent)
  if (amountCents !== registration.priceCents || currency !== registration.currency) {
    console.error(`demo-payment-webhook: amount/currency mismatch for ${demoRegistrationId} (event ${amountCents} ${currency} vs on-file ${registration.priceCents} ${registration.currency})`)
    return
  }

  // Only transition pending -> paid. Never overwrite a terminal state (e.g.
  // a late-arriving duplicate-ish event after a refund already happened).
  if (registration.paymentStatus !== 'pending') return

  tx.update(ref, {
    paymentStatus: 'paid',
    paymentSessionId: stripeEvent.data.object.id?.startsWith('cs_') ? stripeEvent.data.object.id : (registration.paymentSessionId ?? null),
    paymentIntentId: stripeEvent.data.object.payment_intent || (stripeEvent.data.object.id?.startsWith('pi_') ? stripeEvent.data.object.id : registration.paymentIntentId ?? null),
    updatedAt: FieldValue.serverTimestamp(),
  })
  await confirmHeldSeat(tx, db, registration.demoOfferingId)
}

async function handlePaymentFailedOrExpired(tx, db, stripeEvent, terminalPaymentStatus) {
  const demoRegistrationId = demoRegistrationIdFromEvent(stripeEvent)
  if (!demoRegistrationId) return
  const ref = db.collection('demoRegistrations').doc(demoRegistrationId)
  const snap = await tx.get(ref)
  if (!snap.exists) return
  const registration = snap.data()

  // Only transition out of 'pending'. A registration that already succeeded
  // (paid) or already failed must never be re-cancelled by a stray event.
  if (registration.paymentStatus !== 'pending') return

  tx.update(ref, {
    paymentStatus: terminalPaymentStatus,
    demoStatus: 'cancelled',
    updatedAt: FieldValue.serverTimestamp(),
  })
  await releaseHeldSeat(tx, db, registration.demoOfferingId)

  const creditRef = db.collection('demoCredits').doc(demoRegistrationId)
  const creditSnap = await tx.get(creditRef)
  if (creditSnap.exists && creditSnap.data().status === 'pending_attendance') {
    tx.update(creditRef, { status: 'void', updatedAt: FieldValue.serverTimestamp() })
  }

  // Cancelled demo -> release the one-time-offer lock so the family can retry.
  if (registration.childEligibilityKeyHash) {
    tx.delete(db.collection('demoEligibilityLocks').doc(registration.childEligibilityKeyHash))
  }
}

async function handleChargeRefunded(tx, db, stripeEvent) {
  const charge = stripeEvent.data.object
  const paymentIntentId = charge.payment_intent
  if (!paymentIntentId) return

  const query = await tx.get(
    db.collection('demoRegistrations').where('paymentIntentId', '==', paymentIntentId).limit(1)
  )
  if (query.empty) return
  const doc = query.docs[0]
  const registration = doc.data()

  tx.update(doc.ref, { paymentStatus: 'refunded', updatedAt: FieldValue.serverTimestamp() })

  const creditRef = db.collection('demoCredits').doc(doc.id)
  const creditSnap = await tx.get(creditRef)
  if (creditSnap.exists) {
    const creditStatus = creditSnap.data().status
    if (creditStatus === 'pending_attendance' || creditStatus === 'available') {
      tx.update(creditRef, { status: 'void', updatedAt: FieldValue.serverTimestamp() })
    }
    // If the credit is already 'applied', it's in use on a real enrollment.
    // Clawing it back requires the platform repo's manual staff action —
    // deliberately out of scope here; leave it untouched.
  }
}

/**
 * Reconciles one verified Stripe event. Idempotent by event.id via
 * processedDemoWebhookEvents/{event.id} — a duplicate delivery of the same
 * event.id is a no-op on the second (and any subsequent) call.
 */
export async function reconcileDemoWebhookEvent(db, stripeEvent) {
  const processedRef = db.collection('processedDemoWebhookEvents').doc(stripeEvent.id)

  await db.runTransaction(async tx => {
    const processedSnap = await tx.get(processedRef)
    if (processedSnap.exists) return // Duplicate delivery — no-op.

    tx.set(processedRef, {
      type: stripeEvent.type,
      processedAt: FieldValue.serverTimestamp(),
    })

    if (stripeEvent.type === 'checkout.session.completed' || stripeEvent.type === 'payment_intent.succeeded') {
      await handlePaymentSucceeded(tx, db, stripeEvent)
    } else if (stripeEvent.type === 'checkout.session.expired') {
      await handlePaymentFailedOrExpired(tx, db, stripeEvent, 'canceled')
    } else if (stripeEvent.type === 'payment_intent.payment_failed') {
      await handlePaymentFailedOrExpired(tx, db, stripeEvent, 'failed')
    } else if (stripeEvent.type === 'charge.refunded') {
      await handleChargeRefunded(tx, db, stripeEvent)
    }
  })
}

export const handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  if (!demoPaymentsEnabled()) {
    return { statusCode: 503, body: JSON.stringify({ error: 'Demo registration is temporarily unavailable.' }) }
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return { statusCode: 500, body: 'STRIPE_WEBHOOK_SECRET not set' }
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const signature = event.headers['stripe-signature']

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('demo-payment-webhook signature verification failed:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  try {
    const db = getAdminDb()
    await reconcileDemoWebhookEvent(db, stripeEvent)
    return { statusCode: 200, body: JSON.stringify({ received: true }) }
  } catch (error) {
    console.error('demo-payment-webhook reconciliation failed:', error)
    return { statusCode: 500, body: JSON.stringify({ error: 'internal error' }) }
  }
}
