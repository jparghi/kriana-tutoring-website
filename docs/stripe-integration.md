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
