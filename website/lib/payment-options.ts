// Which payment methods the public /events pages offer. Both are build-time
// flags (Netlify env), so changing one needs a rebuild.
//
// Card (Stripe Checkout): NEXT_PUBLIC_ENABLE_CARD_PAYMENTS. The server's
// ENABLE_CARD_PAYMENTS is the real control (submit-demo-registration.js).
export const CARD_PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CARD_PAYMENTS === 'true'

// Interac e-Transfer is hidden while card payments are on (decided
// 2026-11-04). Set NEXT_PUBLIC_SHOW_ETRANSFER_OPTION=true to offer it again
// next to card. With card off, e-Transfer is always offered, since it is
// then the only way to pay. The server still accepts e-Transfer bookings.
export const ETRANSFER_OFFERED = !CARD_PAYMENTS_ENABLED || process.env.NEXT_PUBLIC_SHOW_ETRANSFER_OPTION === 'true'
