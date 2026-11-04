// Stripe webhook receiver for card-paid /events registrations
// (demoRegistrations with paymentProvider 'stripe' — see
// create-demo-payment-session.js and docs/stripe-card-payments-plan.md).
//
// Structured in three layers on purpose:
//   1. `reconcileDemoWebhookEvent` — the Firestore state change for one
//      already-verified Stripe event, in one transaction. Fully unit-testable
//      without a real Stripe-signed payload. Returns what happened.
//   2. `afterDemoPaymentOutcome` — best-effort follow-ups once that commits
//      (parent/admin email, Demo Lead Tracker). Never throws.
//   3. `handler` — the Netlify Function glue: fail-closed flag check, raw-body
//      signature verification via stripe.webhooks.constructEvent, then (1)
//      and (2).
//
// Deliberately NOT gated on ENABLE_CARD_PAYMENTS: a checkout already in
// flight when card payments are switched off must still settle.
//
// Seat bookkeeping matches the portal's demo-lifecycle.js: the registration
// carries capacityHoldActive / confirmedSeatActive, and the offering's
// heldCount/confirmedCount only move when those say the seat is where we
// expect. Without the stamp, the portal's Attended action would try to move
// an already-confirmed seat a second time.
//
// Eligibility-lock lifecycle policy implemented here (see also
// submit-demo-registration.js):
//   - Demo `registered` (pending OR paid, not yet attended) -> lock stays.
//   - Demo `attended` / `no_show` -> lock stays permanently (portal-only
//     statuses; this file never sets them or deletes their lock).
//   - Demo `cancelled` (payment failure/abandoned checkout, handled here) ->
//     DELETE the lock so the family can retry.
//
// A refund only marks the registration refunded (full refunds only) and voids
// an unused credit. It does NOT cancel the booking or free the seat — staff
// do that with the portal's Cancel action, which also restores waitlists.
import Stripe from 'stripe'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'
import { sendDemoAcknowledgement } from './_lib/demo-email.js'
import { LEAD_ACTIVITY_TYPE, LEAD_STATUS, logLeadActivity, recordLeadStatusEvent } from './_lib/demo-lead.js'

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

// Same reading as the portal's seatIsHeld/seatIsConfirmed: a fresh
// registration has neither flag and its seat counts as held.
function seatIsHeld(registration) {
  if (registration.confirmedSeatActive === true) return false
  return registration.capacityHoldActive !== false
}

/**
 * Releases one still-unpaid card registration: cancels it, frees its held
 * seat, voids its credit and deletes its eligibility lock so the family can
 * register again. Runs inside the caller's transaction; does every read
 * before its first write. No-op (returns null) unless the registration is
 * still registered + pending. Shared by the webhook (checkout expired /
 * payment failed) and cancel-demo-payment-session.js (parent came back from
 * Stripe without paying).
 */
export async function releaseUnpaidRegistrationInTx(tx, db, demoRegistrationId, terminalPaymentStatus, reason) {
  const ref = db.collection('demoRegistrations').doc(demoRegistrationId)
  const snap = await tx.get(ref)
  if (!snap.exists) return null
  const registration = snap.data()

  // Only transition out of 'pending'. A registration that already succeeded
  // (paid) or already failed must never be re-cancelled by a stray event.
  if (registration.paymentStatus !== 'pending' || registration.demoStatus !== 'registered') return null

  // Read BEFORE any write below — Firestore transactions require every read
  // to happen before the first write in the transaction.
  const creditRef = db.collection('demoCredits').doc(demoRegistrationId)
  const creditSnap = await tx.get(creditRef)

  tx.update(ref, {
    paymentStatus: terminalPaymentStatus,
    demoStatus: 'cancelled',
    capacityHoldActive: false,
    confirmedSeatActive: false,
    cancelledAt: FieldValue.serverTimestamp(),
    cancelledBy: 'system',
    cancelReason: reason,
    updatedAt: FieldValue.serverTimestamp(),
  })

  if (registration.demoOfferingId && seatIsHeld(registration)) {
    tx.update(db.collection('programOfferings').doc(registration.demoOfferingId), {
      heldCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  if (creditSnap.exists && creditSnap.data().status === 'pending_attendance') {
    tx.update(creditRef, { status: 'void', updatedAt: FieldValue.serverTimestamp() })
  }

  // Cancelled demo -> release the one-time-offer lock so the family can retry.
  if (registration.childEligibilityKeyHash) {
    tx.delete(db.collection('demoEligibilityLocks').doc(registration.childEligibilityKeyHash))
  }

  return { released: true, demoRegistrationId, paymentProvider: registration.paymentProvider ?? null }
}

async function handlePaymentSucceeded(tx, db, stripeEvent) {
  const demoRegistrationId = demoRegistrationIdFromEvent(stripeEvent)
  if (!demoRegistrationId) return null
  const obj = stripeEvent.data.object
  // A completed Checkout Session can still be unpaid for delayed payment
  // methods. Sessions are created card-only, but never trust that here.
  if (stripeEvent.type === 'checkout.session.completed' && obj.payment_status && obj.payment_status !== 'paid') return null

  const ref = db.collection('demoRegistrations').doc(demoRegistrationId)
  const snap = await tx.get(ref)
  if (!snap.exists) return null
  const registration = snap.data()

  // Defense in depth against a tampered event, even though Stripe signs
  // these payloads: the amount/currency on the wire must match what we
  // recorded when the registration was created.
  const { amountCents, currency } = eventAmountAndCurrency(stripeEvent)
  if (amountCents !== registration.priceCents || currency !== String(registration.currency || '').toUpperCase()) {
    console.error(`demo-payment-webhook: amount/currency mismatch for ${demoRegistrationId} (event ${amountCents} ${currency} vs on-file ${registration.priceCents} ${registration.currency})`)
    return null
  }

  // Only transition pending -> paid. Never overwrite a terminal state (e.g.
  // a late-arriving duplicate-ish event after a refund already happened).
  if (registration.paymentStatus !== 'pending') return null
  if (registration.demoStatus !== 'registered') {
    // Money arrived for a registration that was already cancelled — staff
    // must refund it by hand. Loud log; nothing to reconcile automatically.
    console.error(`demo-payment-webhook: payment received for ${demoRegistrationId} in demoStatus ${registration.demoStatus} — refund needed`)
    return null
  }

  const moveSeat = Boolean(registration.demoOfferingId) && seatIsHeld(registration)

  tx.update(ref, {
    paymentStatus: 'paid',
    paymentReceivedMethod: 'card',
    paymentReceivedAt: FieldValue.serverTimestamp(),
    capacityHoldActive: false,
    confirmedSeatActive: true,
    paymentSessionId: obj.id?.startsWith('cs_') ? obj.id : (registration.paymentSessionId ?? null),
    paymentIntentId: obj.payment_intent || (obj.id?.startsWith('pi_') ? obj.id : registration.paymentIntentId ?? null),
    updatedAt: FieldValue.serverTimestamp(),
  })
  if (moveSeat) {
    tx.update(db.collection('programOfferings').doc(registration.demoOfferingId), {
      heldCount: FieldValue.increment(-1),
      confirmedCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
  return { paid: true, demoRegistrationId }
}

async function handleChargeRefunded(tx, db, stripeEvent) {
  const charge = stripeEvent.data.object
  const paymentIntentId = charge.payment_intent
  if (!paymentIntentId) return null

  const query = await tx.get(
    db.collection('demoRegistrations').where('paymentIntentId', '==', paymentIntentId).limit(1)
  )
  if (query.empty) return null
  const doc = query.docs[0]

  // charge.refunded also fires for a PARTIAL refund; only a full refund
  // (charge.refunded === true) makes the registration 'refunded'. A partial
  // one is just recorded for staff.
  if (charge.refunded !== true) {
    tx.update(doc.ref, {
      amountRefundedCents: Number(charge.amount_refunded) || 0,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return { partialRefund: true, demoRegistrationId: doc.id }
  }

  // Read BEFORE any write below — same read-before-write requirement as
  // releaseUnpaidRegistrationInTx above.
  const creditRef = db.collection('demoCredits').doc(doc.id)
  const creditSnap = await tx.get(creditRef)

  tx.update(doc.ref, {
    paymentStatus: 'refunded',
    amountRefundedCents: Number(charge.amount_refunded) || 0,
    refundedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  if (creditSnap.exists) {
    const creditStatus = creditSnap.data().status
    if (creditStatus === 'pending_attendance' || creditStatus === 'available') {
      tx.update(creditRef, { status: 'void', updatedAt: FieldValue.serverTimestamp() })
    }
    // If the credit is already 'applied', it's in use on a real enrollment.
    // Clawing it back requires the platform repo's manual staff action —
    // deliberately out of scope here; leave it untouched.
  }
  return { refunded: true, demoRegistrationId: doc.id }
}

/**
 * Reconciles one verified Stripe event. Idempotent by event.id via
 * processedDemoWebhookEvents/{event.id} — a duplicate delivery of the same
 * event.id is a no-op on the second (and any subsequent) call. Resolves to
 * what changed ({ paid } / { released } / { refunded } / { partialRefund }),
 * or null when nothing did.
 */
export async function reconcileDemoWebhookEvent(db, stripeEvent) {
  const processedRef = db.collection('processedDemoWebhookEvents').doc(stripeEvent.id)

  return db.runTransaction(async tx => {
    const processedSnap = await tx.get(processedRef)
    if (processedSnap.exists) return null // Duplicate delivery — no-op.

    // Marking the event processed is itself a write, so it must come AFTER
    // every read below it — Firestore transactions require all reads before
    // any write. Each handler does its own reads first internally.
    let outcome = null
    if (stripeEvent.type === 'checkout.session.completed' || stripeEvent.type === 'payment_intent.succeeded') {
      outcome = await handlePaymentSucceeded(tx, db, stripeEvent)
    } else if (stripeEvent.type === 'checkout.session.expired') {
      const id = demoRegistrationIdFromEvent(stripeEvent)
      outcome = id ? await releaseUnpaidRegistrationInTx(tx, db, id, 'canceled', 'Card checkout expired') : null
    } else if (stripeEvent.type === 'payment_intent.payment_failed') {
      // Checkout lets the parent retry another card on the same page, so a
      // failed attempt only ends the registration when it came from outside
      // Checkout; the session's own expiry handles the abandoned case.
      const id = demoRegistrationIdFromEvent(stripeEvent)
      const insideCheckout = Boolean(stripeEvent.data.object?.metadata?.checkout)
      outcome = id && !insideCheckout ? await releaseUnpaidRegistrationInTx(tx, db, id, 'failed', 'Card payment failed') : null
    } else if (stripeEvent.type === 'charge.refunded') {
      outcome = await handleChargeRefunded(tx, db, stripeEvent)
    }

    tx.set(processedRef, {
      type: stripeEvent.type,
      processedAt: FieldValue.serverTimestamp(),
    })
    return outcome
  })
}

function snapshotEventFields(registration) {
  // The registration's own snapshot wins over the live offering doc, so the
  // email repeats what the family saw at booking time.
  const snapshot = registration.eventSnapshot || {}
  const picked = {}
  for (const key of ['eventTitle', 'eventType', 'eventStartAt', 'eventEndAt', 'timezone', 'location']) {
    if (snapshot[key] != null) picked[key] = snapshot[key]
  }
  return picked
}

/**
 * Best-effort follow-ups after reconcileDemoWebhookEvent committed. Never
 * throws: the payment is already recorded, and Stripe would only redeliver
 * an event that is now a processed no-op anyway.
 *   paid     -> parent + admin "payment received" email, lead CONFIRMED
 *   released -> (card registrations) lead LOST, "card payment not completed"
 */
export async function afterDemoPaymentOutcome(db, outcome, { sendEmail = sendDemoAcknowledgement } = {}) {
  if (!outcome?.demoRegistrationId) return
  const registrationId = outcome.demoRegistrationId
  try {
    if (outcome.paid) {
      const snap = await db.collection('demoRegistrations').doc(registrationId).get()
      if (!snap.exists) return
      const registration = snap.data()
      const [programSnap, offeringSnap] = await Promise.all([
        registration.demoProgramId ? db.collection('programs').doc(registration.demoProgramId).get() : null,
        registration.demoOfferingId ? db.collection('programOfferings').doc(registration.demoOfferingId).get() : null,
      ])
      const offering = {
        ...(offeringSnap?.exists ? offeringSnap.data() : {}),
        ...snapshotEventFields(registration),
        demoCreditEnabled: registration.demoCreditEnabled,
      }
      const emailed = await sendEmail({
        registration: {
          ...registration,
          taxCents: registration.priceTaxCents,
          paymentMethod: 'card',
        },
        program: programSnap?.exists ? programSnap.data() : null,
        offering,
        reference: registration.registrationNumber,
      })
      await recordLeadStatusEvent(db, {
        registrationId,
        toStatus: LEAD_STATUS.CONFIRMED,
        onlyFromStatuses: [LEAD_STATUS.NEW],
        type: LEAD_ACTIVITY_TYPE.PAYMENT_CONFIRMED,
        description: 'Card payment received (Stripe)',
        metadata: { paymentMethod: 'card' },
      })
      if (emailed) {
        await logLeadActivity(db, {
          registrationId,
          type: LEAD_ACTIVITY_TYPE.ACK_EMAIL_SENT,
          description: 'Payment received email sent to parent',
        })
      }
    } else if (outcome.released && outcome.paymentProvider === 'stripe') {
      await recordLeadStatusEvent(db, {
        registrationId,
        toStatus: LEAD_STATUS.LOST,
        onlyFromStatuses: [LEAD_STATUS.NEW],
        type: LEAD_ACTIVITY_TYPE.CANCELLED,
        description: 'Card payment not completed; spot released',
        extra: { lostReason: 'Card payment not completed' },
      })
    }
  } catch (error) {
    console.error('demo-payment-webhook follow-up failed (payment state already saved):', error)
  }
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
  // Signature verification needs the exact raw bytes Stripe sent.
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('demo-payment-webhook signature verification failed:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  try {
    const db = getAdminDb()
    const outcome = await reconcileDemoWebhookEvent(db, stripeEvent)
    await afterDemoPaymentOutcome(db, outcome)
    return { statusCode: 200, body: JSON.stringify({ received: true }) }
  } catch (error) {
    console.error('demo-payment-webhook reconciliation failed:', error)
    return { statusCode: 500, body: JSON.stringify({ error: 'internal error' }) }
  }
}
