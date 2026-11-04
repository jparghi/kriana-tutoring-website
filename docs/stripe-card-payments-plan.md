# Stripe Card Payments for Events: Implementation Plan

Started: 2026-11-04

**Goal:** let parents pay by card (Stripe Checkout) on `/events` registrations,
alongside today's pay-first Interac e-Transfer flow. Card payments stay behind a
new, off-by-default setting (`ENABLE_CARD_PAYMENTS`) until Phase 6.

**Owner key:** **You** = Stripe dashboard, Netlify and decisions. **Dev** = code.

Background: see [stripe-integration.md](stripe-integration.md). Keys live only in the
gitignored `stripe-keys.md` and in Netlify, never in committed files or chat.

## Where we are (2026-11-04)

| Phase | Status |
|---|---|
| 0 Decisions | ✅ Done |
| 1 Stripe account | ✅ "kriana tutoring website" account (public name **Kriana Tutoring Inc**): verified, payouts to TD ••••9545, statement descriptor `WWW.KRIANATUTORING.COM`. |
| 2–4 Code (website + portal) | ✅ Done and on master. Card payments are **off** on the live site. |
| 5 Testing on `stripe-test` | 🟡 Card payment + email ✅, back arrow ✅, refund ✅, e-Transfer ✅, live site still refuses card ✅. Close-the-tab expiry is running. Declined card is optional. |
| 6 Go live | ✅ **Live on krianatutoring.com since 2026-11-04 ~3:45 PM.** First real card payment ($38.42) settled through the live webhook. |

**Next:** cancel the live test booking DEMO-2026-0070 (already refunded) and the sandbox test bookings 0065 to 0069 in the portal. Optionally: update the
Stripe support phone to 613-400-6921, add Checkout branding, roll the sandbox
keys, and decide whether to keep the `stripe-test` branch.

**Rollback:** set `ENABLE_CARD_PAYMENTS` and `NEXT_PUBLIC_ENABLE_CARD_PAYMENTS`
to `false` for Production and redeploy. The form goes back to e-Transfer only.

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

## Phase 1: Stripe account setup (You)

**Which Stripe account (decided 2026-11-04):** card payments for the website use
the **"kriana tutoring website"** Stripe account, kept separate from the
TutorBird-linked **Kriana Tutoring Inc** (`acct_1PGQyyJy27wNcXJo`). A third
account, **KrianaTutoring**, is unused here. Testing uses that account's sandbox,
**"kriana tutoring website sandbox"**.

Netlify now holds the sandbox's keys (`sk_test_51UY9yC5…`, `pk_test_51UY9yC5…`)
in all contexts. That's safe because card payments are off on the live site.
The keys and the webhook secret were shared in chat, so roll them after testing
(sandbox only, no real money).

- [x] Testing account chosen: "kriana tutoring website sandbox".
- [ ] **Before go-live:** verify the **"kriana tutoring website"** business
      (setup guide → "Verify your account") and add the bank account for payouts.
- [ ] **Before go-live:** set its statement descriptor to "KRIANA TUTORING"
      (Settings → Business → Public details).
- [ ] After testing: roll the sandbox secret key and webhook secret, and update Netlify.

**Gotcha:** the Stripe account menu mixes several accounts and sandboxes. Always
check the account name at the top left before changing anything.

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

**Test site:** https://stripe-test--earnest-sprinkles-f67601.netlify.app. This is
a Netlify branch deploy of `stripe-test`, the same code as master. Card switches
are `true` for `branch:stripe-test` only, along with the `DEMO_CAMPAIGN_*` ids.
The live site is unchanged and still refuses card payments (503). Test bookings
write to the real Firestore, so cancel them in the portal afterwards.

**Netlify 4 KB limit (found 2026-11-04):** each function gets at most 4 KB of
environment variables. Branch deploys use the larger
`FIREBASE_SERVICE_ACCOUNT_JSON`, which put `stripe-test` at 4,172 bytes and
failed the deploy. Fixed with a trimmed copy for `branch:stripe-test` only
(project_id, client_email and private_key), giving 3,670 bytes. Production uses
`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` and sits at 3,549 bytes. Other
branch deploys and previews are at 3,974 bytes, close to the limit. Restricting
variables to "Builds" only needs a paid Netlify plan.

- [x] Branch deploys enabled for `stripe-test`, and the test site is built.
- [x] Sandbox webhook destination created (same 4 events) pointing at
      `https://stripe-test--earnest-sprinkles-f67601.netlify.app/.netlify/functions/demo-payment-webhook`,
      with its secret in Netlify.
- [ ] Test cases on the test site:
  - [x] Card `4242 4242 4242 4242`: paid, and the "Payment Received" email
        arrived (DEMO-2026-0066, $38.42, 2026-11-04).
  - [ ] Portal shows that booking as **paid** + **card**, and the lead as CONFIRMED.
  - [ ] Declined card `4000 0000 0000 0002`: needs a person on Stripe's page (Stripe shows the error; none of our code runs). Optional.
  - [x] Back arrow on Stripe without paying: session expired at once, seat released, same child re-registered right away (DEMO-2026-0067 → 0068; run via API 2026-11-04). The form's "nothing was charged" note still needs a look in a browser.
  - [x] Closing the Stripe tab: DEMO-2026-0068's checkout expired at 15:51, and the webhook released it with no errors (2026-11-04).
  - [x] Refund (DEMO-2026-0066, full, via sandbox API): `charge.refunded` delivered and processed without errors. Check the portal shows **refunded**.
  - [x] e-Transfer path: DEMO-2026-0069 saved with ref TEST1234 and the email went to info@. A missing reference is still refused, and the live site still refuses card (checked 2026-11-04).
- [ ] Clean up: cancel test bookings DEMO-2026-0066 to 0069 in the portal (children "Stripe Test Child B/C"), plus DEMO-2026-0065,
      which was paid against the wrong account's keys and stays pending.

## Before go-live (checklist)

**Must-do**
- [ ] **You:** verify the **"kriana tutoring website"** Stripe account in **live**
      mode (not the sandbox). This is the slowest step, so start it first.
  - [ ] Business details: legal name, address, business number, and the owner's ID.
  - [ ] Bank account for payouts (without it, Stripe holds the money).
  - [ ] Statement name: Settings → Business → Public details → `KRIANA TUTORING`.
- [ ] **You:** check the portal (DEMO-2026-0066 shows **refunded** + **card**),
      then cancel test bookings DEMO-2026-0065 to 0069.
- [x] **Dev:** close-the-tab test passed (expired at 15:51, released automatically).

**Nice-to-have**
- [ ] **You:** Checkout branding: Stripe → Settings → Branding → logo + teal `#0c6162`,
      so Stripe's payment page looks like Kriana.
- [ ] **You:** try the test site in a browser once: a declined card
      (`4000 0000 0000 0002`) and the back arrow, to see what parents see.
- [ ] **You:** roll the sandbox secret key and webhook secret (they were shared in chat; test-only).

**Already checked:** production has room for the extra settings (3,549 of
the 4,096-byte function limit), and the code is on master, so go-live needs no push.

## Phase 6: Go live — ✅ done 2026-11-04

- [x] Account verified, bank account linked (TD ••••9545), statement descriptor set.
- [x] Live secret key ("krianatutoring.com website (Netlify)"),
      live publishable key and live webhook secret set for Netlify **Production**
      only, all marked secret. Other contexts keep the sandbox values, and
      `branch:stripe-test` has its own sandbox webhook secret.
- [x] Live webhook destination → `https://krianatutoring.com/.netlify/functions/demo-payment-webhook` (4 events).
- [x] `ENABLE_CARD_PAYMENTS=true` and `NEXT_PUBLIC_ENABLE_CARD_PAYMENTS=true` for
      Production; production rebuilt (deploy 6aeb98cf…). /events shows "Card or e-Transfer".
- [x] Real booking with own card: $38.42 paid, webhook processed with no errors.
- [x] Refunded DEMO-2026-0070 in Stripe (live, 8:52 PM UTC); `charge.refunded` processed with no errors.
- [ ] Cancel DEMO-2026-0070 in the portal (frees the Nov 20 morning seat).
- [ ] Watch the first few real card bookings in the portal.
- [ ] Optional: delete the `stripe-test` branch and its sandbox webhook, or keep them for future testing.

**Rollback:** set `ENABLE_CARD_PAYMENTS=false` (and the `NEXT_PUBLIC_` one), then
redeploy. The form goes back to e-Transfer only, and existing card bookings are unaffected.
