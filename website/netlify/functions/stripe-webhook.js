import Stripe from 'stripe'

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

async function patchDoc(collection, id, fields) {
  const mask = Object.keys(fields).map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&')
  const body = {
    fields: Object.fromEntries(
      Object.entries(fields).map(([k, v]) => {
        if (v === null) return [k, { nullValue: null }]
        if (typeof v === 'string') return [k, { stringValue: v }]
        if (typeof v === 'number') return [k, Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }]
        if (typeof v === 'boolean') return [k, { booleanValue: v }]
        return [k, { stringValue: String(v) }]
      })
    ),
  }
  const res = await fetch(`${FS_BASE}/${collection}/${id}?${mask}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.ok
}

async function incrementSessionCount(sessionId) {
  const res = await fetch(`${FS_BASE}/sessions/${sessionId}`)
  if (!res.ok) return
  const doc = await res.json()
  const current = parseInt(doc.fields?.confirmedCount?.integerValue ?? '0')
  await patchDoc('sessions', sessionId, { confirmedCount: current + 1 })
}

async function sendConfirmationEmail(registrationId) {
  const siteUrl = process.env.URL || 'https://krianatutoring.com'
  await fetch(`${siteUrl}/.netlify/functions/send-booking-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationId, type: 'confirmed' }),
  })
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return { statusCode: 500, body: 'STRIPE_WEBHOOK_SECRET not set' }
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const sig = event.headers['stripe-signature']

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  const now = new Date().toISOString()

  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object
      const { registrationId, sessionId } = session.metadata ?? {}

      if (registrationId) {
        await patchDoc('registrations', registrationId, {
          registrationStatus: 'Confirmed',
          paymentStatus: 'Paid',
          amountPaid: session.amount_total,
          stripeSessionId: session.id,
          updatedAt: now,
        })

        if (sessionId) await incrementSessionCount(sessionId)
        await sendConfirmationEmail(registrationId)
      }
    }

    if (stripeEvent.type === 'checkout.session.expired') {
      const session = stripeEvent.data.object
      const { registrationId } = session.metadata ?? {}

      if (registrationId) {
        await patchDoc('registrations', registrationId, {
          registrationStatus: 'Expired',
          updatedAt: now,
        })
      }
    }

    if (stripeEvent.type === 'charge.refunded') {
      const charge = stripeEvent.data.object
      const paymentIntentId = charge.payment_intent

      if (paymentIntentId) {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
        const { registrationId } = pi.metadata ?? {}

        if (registrationId) {
          await patchDoc('registrations', registrationId, {
            paymentStatus: 'Refunded',
            registrationStatus: 'Refunded',
            updatedAt: now,
          })
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) }
  } catch (err) {
    console.error('stripe-webhook error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
