// Expires stale, unpaid $10 Young Engineers Demo Registration holds.
//
// A demo registration reserves a held seat (offering.heldCount) at creation
// time but isn't paid until the family sends their e-transfer and staff
// confirms it (see confirmDemoEtransferPayment in the platform repo). If a
// family never sends the e-transfer, this job releases the hold after 48
// hours — long enough for normal e-transfer turnaround — so the seat becomes
// available again rather than staying stuck forever.
//
// Scheduled via netlify.toml's `[functions."expire-demo-payment-holds"]`
// block (hourly cron), mirroring the platform repo's
// `expire-enrollment-offers` pattern.
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'

const HOLD_TIMEOUT_MS = 48 * 60 * 60 * 1000
const MAX_PER_RUN = 200

function demoPaymentsEnabled() {
  return process.env.ENABLE_DEMO_PAYMENTS === 'true'
}

/**
 * Expires one stale-held demo registration in its own transaction: release
 * the offering's held seat, mark the registration cancelled, void its demo
 * credit, and delete its eligibility lock so the family can retry. Exported
 * for tests.
 */
export async function expireOneDemoHold(db, registrationId) {
  const ref = db.collection('demoRegistrations').doc(registrationId)

  await db.runTransaction(async tx => {
    const snap = await tx.get(ref)
    if (!snap.exists) return
    const registration = snap.data()
    // Re-check inside the transaction — another process (e.g. the webhook)
    // may have already resolved this registration since the query ran.
    if (registration.demoStatus !== 'registered' || registration.paymentStatus !== 'pending') return

    tx.update(ref, {
      demoStatus: 'cancelled',
      paymentStatus: 'canceled',
      updatedAt: FieldValue.serverTimestamp(),
    })

    if (registration.demoOfferingId) {
      tx.update(db.collection('programOfferings').doc(registration.demoOfferingId), {
        heldCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }

    const creditRef = db.collection('demoCredits').doc(registrationId)
    const creditSnap = await tx.get(creditRef)
    if (creditSnap.exists && creditSnap.data().status === 'pending_attendance') {
      tx.update(creditRef, { status: 'void', updatedAt: FieldValue.serverTimestamp() })
    }

    if (registration.childEligibilityKeyHash) {
      tx.delete(db.collection('demoEligibilityLocks').doc(registration.childEligibilityKeyHash))
    }
  })
}

export async function expireDuePendingDemoHolds(db, { now = Date.now(), limit = MAX_PER_RUN } = {}) {
  const cutoff = Timestamp.fromMillis(now - HOLD_TIMEOUT_MS)
  const snapshot = await db.collection('demoRegistrations')
    .where('demoStatus', '==', 'registered')
    .where('paymentStatus', '==', 'pending')
    .where('createdAt', '<', cutoff)
    .limit(limit)
    .get()

  let expired = 0
  for (const doc of snapshot.docs) {
    await expireOneDemoHold(db, doc.id)
    expired += 1
  }
  return expired
}

export const handler = async () => {
  if (!demoPaymentsEnabled()) {
    return { statusCode: 200, body: JSON.stringify({ skipped: true, reason: 'ENABLE_DEMO_PAYMENTS is not true' }) }
  }

  try {
    const db = getAdminDb()
    const expired = await expireDuePendingDemoHolds(db)
    return { statusCode: 200, body: JSON.stringify({ expired }) }
  } catch (error) {
    console.error('expire-demo-payment-holds failed:', error)
    return { statusCode: 500, body: JSON.stringify({ error: 'internal error' }) }
  }
}
