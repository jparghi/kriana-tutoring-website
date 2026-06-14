# Stripe Integration — Public Booking (krianatutoring.com)

Last updated: 2026-06-14

---

## Overview

Stripe Checkout handles online payments for program registrations. The flow is:

1. Parent fills registration form → chooses "Pay Online"
2. Website calls `create-checkout-session` Netlify function
3. Parent is redirected to Stripe hosted checkout page
4. After payment → Stripe fires webhook → Firestore updated → confirmation email sent
5. Portal admin sees registration as `CONFIRMED` + `PAID` in real time

---

## Step 1 — Add Env Vars to Netlify

In the website Netlify site → Site Settings → Environment Variables, add:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...    ← get this after registering the webhook (Step 2)
```

For local development, add test keys to `website/.env.local`:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Step 2 — Register Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks → Add endpoint
2. Set endpoint URL: `https://krianatutoring.com/.netlify/functions/stripe-webhook`
3. Select these events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `charge.refunded`
4. Save → copy the **Signing secret** (`whsec_...`)
5. Paste it into `STRIPE_WEBHOOK_SECRET` in Netlify env vars

---

## Step 3 — Verify `create-checkout-session.js`

File: `website/netlify/functions/create-checkout-session.js`

This function must:
- Accept POST body: `{ registrationId, programId, sessionId }`
- Look up program price from Firestore
- Create a Stripe Checkout session with:
  - `success_url`: `https://krianatutoring.com/booking/success?session_id={CHECKOUT_SESSION_ID}`
  - `cancel_url`: `https://krianatutoring.com/booking/cancel`
  - `metadata`: `{ registrationId, programId, sessionId }` ← required by webhook
- Return `{ url }` to the frontend

---

## Step 4 — Verify `stripe-webhook.js`

File: `website/netlify/functions/stripe-webhook.js`

This function must:
- Verify the Stripe signature using `STRIPE_WEBHOOK_SECRET`
- On `checkout.session.completed`:
  - Read `registrationId` from `event.data.object.metadata`
  - Update Firestore registration: `registrationStatus → CONFIRMED`, `paymentStatus → PAID`
  - Increment `confirmedCount` on the session document
  - Call `send-booking-confirmation` to email the parent
- On `checkout.session.expired`:
  - Update Firestore: `registrationStatus → EXPIRED`
- On `charge.refunded`:
  - Update Firestore: `paymentStatus → REFUNDED`, `registrationStatus → REFUNDED`

---

## Step 5 — Wire Up the Register Page

File: `website/app/booking/[programId]/register/page.tsx`

When parent submits with Stripe selected:

```ts
// 1. Create registration in Firestore
const registrationId = await createRegistration({ ...form, paymentMethod: 'stripe' })

// 2. Create Stripe Checkout session
const res = await fetch('/.netlify/functions/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ registrationId, programId, sessionId }),
})
const { url } = await res.json()

// 3. Redirect to Stripe hosted page
window.location.href = url
```

---

## Step 6 — Test Locally with Stripe CLI

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli), then run:

```bash
# Terminal 1 — run the site with Netlify functions
cd website
netlify dev

# Terminal 2 — forward webhook events to local function
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

Use Stripe test cards:
| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Payment declined |
| `4000 0025 0000 3155` | Requires 3D Secure |

Any future expiry date and any 3-digit CVC.

---

## Step 7 — Test on Live Site

1. Deploy to Netlify (merge to master)
2. Book a program → choose Pay Online → use a test card
3. Verify in Firestore: registration `registrationStatus = confirmed`, `paymentStatus = paid`
4. Verify parent receives confirmation email
5. Check portal admin (`/tutor/booking/registrations`) — registration should show as Confirmed

Once confirmed working end-to-end, switch Netlify env vars to live Stripe keys.

---

## Stripe Keys Location

- **Stripe Dashboard** → Developers → API keys
- Use **test keys** (`pk_test_`, `sk_test_`) during development
- Use **live keys** (`pk_live_`, `sk_live_`) in production only after full end-to-end test

---

## Portal Admin Side

The portal (`kriana-tutoring-platform`) needs `STRIPE_SECRET_KEY` added to its Netlify env vars so admin can issue refunds via `apps/app/netlify/functions/create-refund.js`.

See portal docs for refund flow details.
