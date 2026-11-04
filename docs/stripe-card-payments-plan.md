# Stripe Card Payments for Events: Implementation Plan

Started: 2026-11-04

**Goal:** let parents pay by card (Stripe Checkout) on `/events` registrations,
alongside today's pay-first Interac e-Transfer flow. Card payments stay behind a
new, off-by-default setting (`ENABLE_CARD_PAYMENTS`) until Phase 6.

**Owner key:** **You** = Stripe dashboard, Netlify and decisions. **Dev** = code.

Background: see [stripe-integration.md](stripe-integration.md). Keys live only in the
gitignored `stripe-keys.md` and in Netlify, never in committed files or chat.

---

## What already exists

- `netlify/functions/create-demo-payment-session.js` creates a Stripe Checkout
  session per registration. A deterministic key stops a double-click from
  creating two sessions.
- `netlify/functions/demo-payment-webhook.js` verifies Stripe's signature and
  ignores repeat deliveries of the same event. It handles four events:
  - `checkout.session.completed` / `payment_intent.succeeded`: marks the
    registration paid and turns the held seat into a confirmed one.
  - `checkout.session.expired`: cancels the registration, frees the seat and
    removes the lock so the family can register again.
  - `payment_intent.payment_failed`: same as expired.
  - `charge.refunded`: marks the registration refunded and voids the credit.
- `/booking/demo-confirmed` is already the success page.
- The `stripe` package is installed, and the env vars are documented in `.env.example`.

## Known gaps (fixed in Phases 2–4)

1. **Wrong price:** `create-demo-payment-session.js` calls `getDemoPricing()`
   **without the offering**, so it always charges the old $10 default. The
   webhook then rejects the payment because the amount doesn't match
   `registration.priceCents`, so the parent pays and the booking never shows
   as paid.
2. **Hard-coded product name:** the Checkout product is named
   "$10 Young Engineers Demo Class".
3. **No card option on the form:** the register form only offers e-Transfer,
   and the server requires `etransferReference` for every paid registration.
4. **No emails for card payments:** the webhook sends nothing, so the family
   gets no confirmation after paying.
5. **Too few tests:** the webhook has tests (paid, wrong amount, expired,
   refunded, sent twice), but none use a real event price, and none cover the
   card flow.
6. **Seat bookkeeping (found 2026-11-04):** the webhook moves the seat to
   confirmed on the event but doesn't stamp `capacityHoldActive: false` /
   `confirmedSeatActive: true` on the registration. Pressing **Attended** in
   the portal would then try to move the seat a second time and fail. The
   lead is also never set to CONFIRMED.
7. **Back from Stripe without paying:** the seat and the child's
   registration lock stay held until the Checkout session expires, so the
   parent can't register again right away. Fix: expire the session and
   release the seat as soon as they come back.
8. **Partial refunds:** `charge.refunded` fires on partial refunds too, so
   only a full refund should mark the booking refunded. Freeing the seat
   stays with the portal's **Cancel** button.

---

## Phase 0: Decisions (You, before any code)

Decided 2026-11-04:

- [x] **Card fee:** absorb it. Parents pay the same price either way.
- [x] **Which events:** all paid events.
- [x] **Order on the form:** card first, e-Transfer second.
- [x] **Refunds:** done from the Stripe dashboard, and the webhook updates the booking.

## Phase 1: Stripe account setup (You, about 30 minutes)

Status check 2026-11-04 (Netlify setting names and key prefixes only):
Netlify **already has** `STRIPE_SECRET_KEY` (`sk_test_…`),
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_…`) and `STRIPE_WEBHOOK_SECRET`
in **both Production and Deploy Previews**. All are **test-mode** keys.
`ENABLE_DEMO_PAYMENTS=true` (the events flow is live with e-Transfer). The
existing test webhook points to the **old** enrollment endpoint
`/.netlify/functions/stripe-webhook`, not to `demo-payment-webhook`.

- [x] Stripe account verified with payouts (Kriana Tutoring Inc, daily automatic payouts to TD Bank; confirmed 2026-11-04). The account is also linked to TutorBird.
- [x] Statement descriptor checked (2026-11-04).
- [x] Test-mode secret and publishable keys are in Netlify (Production + Deploy Previews).
- [x] Keys confirmed to belong to the Kriana Tutoring Inc account (same one TutorBird uses), checked 2026-11-04.
- [ ] Add `ENABLE_CARD_PAYMENTS=false` and `NEXT_PUBLIC_ENABLE_CARD_PAYMENTS=false`
      (can wait until Phase 5; missing settings count as off).
- [ ] Webhook: done in Phase 5 (edit the existing test webhook rather than
      adding a second one; both functions read the same `STRIPE_WEBHOOK_SECRET`).

## Phase 2: Fix the existing Stripe code (Dev) — done, pushed 2026-11-04 (web 3c03b3d, portal b2090ab)

- [x] Checkout charges the registration's stored `priceCents` (HST and early
      bird included), which is exactly what the webhook checks.
- [x] Checkout product name is "<event title> — <child>", with the booking
      number and HST in the description. Card only (Apple/Google Pay included).
- [x] `ENABLE_CARD_PAYMENTS` (server, `_lib/card-payments.js`) and
      `NEXT_PUBLIC_ENABLE_CARD_PAYMENTS` (form and /events wording). The
      webhook and cancel endpoint ignore the switch, so in-flight payments
      still settle after a rollback.
- [x] Checkout sessions expire after 31–41 minutes. A double click returns
      the same session (10-minute idempotency window), and pressing Register
      again resumes an open session.
- [x] Webhook stamps `capacityHoldActive` / `confirmedSeatActive`, records
      `paymentReceivedMethod: 'card'`, ignores unpaid completed sessions,
      ignores failed attempts inside Checkout (the parent can try another
      card), and handles partial refunds (`amountRefundedCents` only).
- [x] Tests: 16 new or updated in `tests/submit-demo-registration.test.mjs`
      (website suite: 324 pass).

## Phase 3: Card option on the form (Dev) — done, pushed 2026-11-04 (web 3c03b3d, portal b2090ab)

- [x] Payment choice on the register form: **Pay by card** (first, default)
      or **Interac e-Transfer** (today's flow, reference required).
- [x] `submit-demo-registration.js` takes `paymentMethod: 'card' | 'etransfer'`:
      a card registration needs no reference, is saved as
      `paymentProvider: 'stripe'`, and is rejected while `ENABLE_CARD_PAYMENTS` is off.
- [x] Register → Stripe Checkout. If Checkout can't open, the registration is
      released immediately and the parent sees "Nothing was charged".
- [x] Back from Stripe without paying → `cancel-demo-payment-session.js`
      expires the session and releases the seat and lock at once, and the
      form shows "nothing was charged, register again below".
- [x] `/booking/demo-confirmed` rewritten: "Payment received. You're booked!"
      with booking reference and amount (no more "$10 demo").
- [x] /events wording ("Card or e-Transfer") and the payment FAQ follow the switch.

## Phase 4: Emails and portal (Dev) — done, pushed 2026-11-04 (web 3c03b3d, portal b2090ab)

- [x] Card registrations get no email at Register (not paid yet). The webhook
      sends "Payment Received" to the parent and "New card-paid registration"
      to admin once Stripe confirms.
- [x] Lead Tracker: paid → CONFIRMED; abandoned checkout → LOST ("Card payment not completed").
- [x] Portal (Event Registrations): **card** badge, **checking out** badge
      while on Stripe, "Paid by card (Stripe)", partial-refund badge. Confirm
      E-Transfer / Cash / reminder buttons hidden for card. The Cancel prompt
      tells staff to refund paid cards in Stripe.

## Phase 5: Test mode end to end (You and Dev)

**Where to test without parents seeing it:** a Netlify *branch deploy* of a
`stripe-test` branch (same code as master), with the card switches set to
`true` for that branch only (Netlify → Environment variables → value for
"Branch deploys" / `branch:stripe-test`). The live site keeps them off.
Branch deploys must be enabled for that branch in Netlify (Site
configuration → Build & deploy → Branches and deploy contexts). Its URL
looks like `https://stripe-test--earnest-sprinkles-f67601.netlify.app`.

- [ ] **You:** Stripe (test mode) → Developers → Webhooks → **edit the existing
      endpoint**: URL `https://stripe-test--earnest-sprinkles-f67601.netlify.app/.netlify/functions/demo-payment-webhook`,
      events:
  - `checkout.session.completed`
  - `checkout.session.expired`
  - `payment_intent.payment_failed`
  - `charge.refunded`
- [ ] (Editing keeps the same signing secret, which Netlify already has.)
- [x] Both card settings set to `true` for `branch:stripe-test` only (plus the DEMO_CAMPAIGN_* ids); production unchanged. Done 2026-11-04.
- [ ] **You:** enable branch deploys for `stripe-test` in Netlify.
- [ ] Test cases on the preview:
  - [ ] Card `4242 4242 4242 4242`: booking is paid, the seat is confirmed and the email arrives.
  - [ ] Declined card `4000 0000 0000 0002`: an error shows and no seat is taken.
  - [ ] Back arrow on Stripe without paying: you return to the form with the "nothing was charged" note, and can register the same child again straight away.
  - [ ] Closing the Stripe tab: the seat is freed within about 40 minutes.
  - [ ] Refunding in the Stripe dashboard: the booking shows refunded.
  - [ ] e-Transfer path: still works exactly as today.
  - [ ] Portal: badges and buttons are correct.

## Phase 6: Go live (You, with Dev checking)

- [ ] **You:** add the **live** secret key (`sk_live_…`) to Netlify **Production**.
- [ ] **You:** create a **live-mode** webhook at
      `https://krianatutoring.com/.netlify/functions/demo-payment-webhook`
      (same 4 events) and add its secret to Production.
- [ ] **Dev:** push to master (only after "push").
- [ ] **You:** set `ENABLE_CARD_PAYMENTS=true` and
      `NEXT_PUBLIC_ENABLE_CARD_PAYMENTS=true` in Production, then redeploy.
- [ ] **You:** make one real booking with your own card, check everything, then refund it in Stripe.
- [ ] **Both:** watch the first few real card bookings in the portal.

**Rollback:** set `ENABLE_CARD_PAYMENTS=false` (and the `NEXT_PUBLIC_` one), then
redeploy. The form goes back to e-Transfer only, and existing card bookings are unaffected.
