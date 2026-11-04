// Card payments (Stripe Checkout) for /events registrations — a second way
// to pay alongside the pay-first Interac e-Transfer flow. Fail closed: only
// the exact string 'true' turns it on. The browser twin,
// NEXT_PUBLIC_ENABLE_CARD_PAYMENTS, only decides whether the form OFFERS
// card; this server flag is the control (submit-demo-registration.js rejects
// a card registration and create-demo-payment-session.js refuses to start a
// checkout without it). The webhook and the cancel endpoint deliberately do
// NOT check it, so a checkout already in flight still settles after a
// rollback. See docs/stripe-card-payments-plan.md.
export function cardPaymentsEnabled() {
  return process.env.ENABLE_CARD_PAYMENTS === 'true'
}
