# Payments for Program Enrollment

Last updated: 2026-07-31

## Current production status

Automated Stripe Checkout, static Stripe Payment Links and e-transfer collection are **disabled for new public registration requests**.

The active enrollment mode is:

```text
BOOKING_FLOW_MODE=request_only
NEXT_PUBLIC_BOOKING_FLOW_MODE=request_only
ENABLE_AUTOMATED_STRIPE_PAYMENTS=false
```

Parents submit a placement request. Staff review the request and contact the family separately. The request page and acknowledgement email both state that no payment is due and that a seat is not yet confirmed.

An absent, misspelled or unsupported browser mode fails closed to `request_only`. Server payment endpoints require an explicit non-default mode as well; hiding a button is not the security control.

## Parked code

The previous implementations remain in source control only to support reconciliation of legacy records and a future redesign:

- `website/netlify/functions/create-checkout-session.js`
- `website/netlify/functions/stripe-webhook.js`
- `website/netlify/functions/send-booking-confirmation.js`
- `website/netlify/functions/expire-etransfer-holds.js`
- `website/netlify/functions/notify-next-waitlisted.js`
- `website/app/booking/pay/**`
- `website/app/booking/etransfer/**`
- `website/app/booking/success/**`
- `website/app/booking/cancel/**`

Do not re-enable these functions for production by changing one flag. The old Checkout endpoint trusts browser-supplied commercial fields, the static Payment Link flow cannot reliably reconcile a payment to one enrollment, and the legacy notification endpoints do not yet have the authentication and idempotency required for a live payment system.

Previously shared Payment Link URLs also remain usable until they are deactivated in the Stripe Dashboard. Disabling them in Firestore or hiding them in the UI is not sufficient.

## Current request flow

1. The parent chooses a published program offering.
2. The browser posts contact and child information to `submit-enrollment-request`.
3. The server loads the authoritative program and offering, validates availability and ignores any client-supplied status or price.
4. The server creates a `Pending Review` registration with payment `Not Requested`.
5. The parent receives a request reference and a no-payment-due acknowledgement.
6. Staff review the request in the management portal.

The public browser must never create or update registrations, waitlist records, counters, payment state or capacity directly.

## Preferred future payment design

If online payment is introduced, start with a unique Stripe Hosted Invoice generated only after staff offers a seat. A per-enrollment invoice provides a customer-specific link and cleaner reconciliation than a shared program Payment Link.

Automated Checkout must remain disabled until all of the following are complete:

- Server-authoritative offering price, currency, discounts and deposit/installment rules.
- Atomic capacity holds with a documented expiry policy.
- Automatic payment-to-enrollment association.
- Idempotent webhook processing with recorded Stripe event IDs.
- Signed or authenticated payment routes.
- Verified payment state on success pages.
- Consistent cancellation, refund and capacity release transactions.
- End-to-end tests for success, failure, retry, duplicate webhook, expiry, full capacity and refunds.
- Monitoring, reconciliation and rollback runbooks.

## Legacy-record reconciliation

Before deactivating old infrastructure:

1. Export and review registrations in `Started` or `Pending Payment` state.
2. Reconcile every associated Stripe or e-transfer payment.
3. Resolve any active refunds or disputes.
4. Disable `stripePaymentLinkEnabled` on every program.
5. Deactivate the corresponding links in Stripe.
6. Keep the e-transfer expiry job in no-op mode after the final legacy hold is resolved.

Never place Stripe, SMTP or Firebase private keys in this repository. Store secrets in Netlify or another managed secret store and use only redacted placeholders in local examples.

See [robotics-enrollment-strategy.md](./robotics-enrollment-strategy.md) for the full cohort, security and portal design, and [enrollment-request-runbook.md](./enrollment-request-runbook.md) for deployment and operations.

## $10 Young Engineers Demo payment lifecycle

The $10 Young Engineers Demo Registration is a **separate, new payment-collecting
product**, entirely independent from the request_only enrollment flow above and
from the parked legacy Stripe Checkout/e-transfer code. It is limited to three
programs: Smartivo, Bricks Challenge, and Algo Play. Submitting a demo
registration is the *only* place this codebase collects real payment today;
the regular Explorer/Builder/Engineer package flow remains `request_only` and
untouched by this feature.

### Fail-closed flags

Two flags gate this feature, mirroring the same fail-closed philosophy as
`BOOKING_FLOW_MODE`/`isRequestOnlyBookingFlow` — an absent, misspelled, or
falsy value always disables the feature, never enables it:

```text
ENABLE_DEMO_PAYMENTS=true                   # server (Netlify Functions)
NEXT_PUBLIC_ENABLE_DEMO_PAYMENTS=true       # browser (hides/shows the CTA only)
```

`NEXT_PUBLIC_ENABLE_DEMO_PAYMENTS` only controls whether the $10 demo CTA
renders on the program page — it is presentation only. Every demo Netlify
Function (`submit-demo-registration`, `create-demo-payment-session`,
`demo-payment-webhook`, `expire-demo-payment-holds`) independently checks
`ENABLE_DEMO_PAYMENTS === 'true'` as the very first thing it does and returns
`503` otherwise, before touching Firestore or Stripe. Hiding the button is
never the only control.

**This feature ships disabled in this delivery.** Neither flag is set, and no
Stripe credentials are configured in this environment. See "Remaining setup
before enabling" below.

### Required environment variables (once enabling)

- `DEMO_ELIGIBILITY_KEY_SALT` — at least 32 characters. Used to compute the
  child eligibility hash (`childEligibilityKeyHash`) that enforces the
  one-time $10 demo offer per child. Missing or short: every demo function
  that needs it throws rather than silently skipping the uniqueness check —
  fail closed, not fail open.
- `STRIPE_SECRET_KEY` — used to create Checkout Sessions and verify webhook
  events server-side.
- `STRIPE_WEBHOOK_SECRET` — used by `demo-payment-webhook` to verify
  `stripe.webhooks.constructEvent`. A missing or wrong secret rejects the
  webhook with `400`/`500` rather than trusting an unsigned payload.

### Lifecycle

```text
demoRegistrations.demoStatus:    registered -> attended | no_show | cancelled
demoRegistrations.paymentStatus: pending -> paid | failed | canceled | refunded
demoCredits.status:               pending_attendance -> available -> applied
                                                      -> void (at any point before applied)
```

1. Parent submits the 5-field demo form (`submit-demo-registration`). A
   `demoRegistrations` doc is created (`registered` / `pending`), a 1:1
   `demoCredits` doc is created (`pending_attendance`), an offering seat is
   held, and a `demoEligibilityLocks/{childEligibilityKeyHash}` doc is
   created via `tx.create()` — the atomic primitive that makes the one-child,
   one-demo rule concurrency-safe.
2. The browser is redirected to Stripe Checkout
   (`create-demo-payment-session`), price always resolved server-side as
   1000 cents CAD — never read from the request body.
3. `demo-payment-webhook` reconciles the Stripe event: `checkout.session.completed`
   / `payment_intent.succeeded` moves `paymentStatus: pending -> paid` and the
   held seat to confirmed; `checkout.session.expired` /
   `payment_intent.payment_failed` cancels the registration, releases the
   seat, voids the credit, and deletes the eligibility lock so the family can
   retry; `charge.refunded` marks the registration `refunded` and voids the
   credit unless it has already been `applied` (clawing back an applied
   credit is a platform-repo manual staff action, out of scope here). Webhook
   processing is idempotent per `event.id` via `processedDemoWebhookEvents`.
4. `expire-demo-payment-holds` (not yet wired into a schedule in this repo —
   see the function's own comment) releases any hold left `pending` for more
   than 30 minutes, the same way an expired/failed webhook event would.
5. Attendance-driven `demoStatus -> attended` / `no_show`, and
   `demoCredits.status: pending_attendance -> available`, are staff actions
   implemented in the platform repo — not in this repository.
6. When a family later submits a *regular* Explorer/Builder/Engineer
   enrollment request for one of the 3 eligible programs, an additive step
   inside `submit-enrollment-request.js`'s existing transaction looks for
   exactly one `available` demo credit matching the same child's eligibility
   hash and, if found, stamps a `creditApplied` field on the new registration
   and flips the credit to `applied` (`matchMethod: 'automatic'`). This never
   changes `registrationStatus`, `paymentStatus`, `amountDue`, or
   `amountPaid` on the regular enrollment request, which remain exactly
   `Pending Review` / `Not Requested` / `0` / `0` as they do today.

### Eligibility-lock policy (one $10 demo per child, ever)

- `registered` (pending or paid, not yet attended) — lock stays; blocks a
  second signup.
- `attended` — lock stays **permanently**. Neither this repo's webhook nor
  its expiry job ever deletes a lock for an attended demo.
- `no_show` — lock stays **permanently** (set by the platform repo; this repo
  never touches it).
- `cancelled` (payment failure, Checkout expiry, or a stale unpaid hold
  expiring) — the lock is **deleted** so the family can retry.

### Remaining setup before enabling

1. Create a Stripe product/price, or confirm the dynamic `price_data`
   approach already implemented in `create-demo-payment-session.js` is
   acceptable.
2. Configure the webhook endpoint in the Stripe Dashboard pointing at
   `demo-payment-webhook`, subscribed to at least: `checkout.session.completed`,
   `checkout.session.expired`, `payment_intent.succeeded`,
   `payment_intent.payment_failed`, `charge.refunded`.
3. Set `DEMO_ELIGIBILITY_KEY_SALT`, `STRIPE_SECRET_KEY`, and
   `STRIPE_WEBHOOK_SECRET` in the Netlify Functions runtime environment (not
   only build-time `[build.environment]`).
4. Wire `expire-demo-payment-holds` into a schedule (this repo's
   `netlify.toml` has no scheduled-functions section today).
5. Flip `ENABLE_DEMO_PAYMENTS=true` and `NEXT_PUBLIC_ENABLE_DEMO_PAYMENTS=true`
   together.
