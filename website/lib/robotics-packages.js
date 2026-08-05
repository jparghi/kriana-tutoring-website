// Canonical robotics class-package catalogue. This is the single source of
// truth for package pricing — imported by both Next.js (client + server
// components) and Netlify Functions (submit-enrollment-request.js). Never
// duplicate these numbers elsewhere; a client-supplied price is never
// trusted, only a packageId is, and the server resolves everything here.

export const ROBOTICS_PACKAGES = Object.freeze([
  Object.freeze({
    id: 'explorer',
    name: 'Explorer',
    classCount: 10,
    perClassCents: 3000,
    subtotalCents: 30000,
    currency: 'CAD',
    badge: null,
    sortOrder: 1,
    // Paid as a single upfront invoice for all classes, rather than billed
    // month-by-month like the larger packages.
    billingCadence: 'upfront',
  }),
  Object.freeze({
    id: 'builder',
    name: 'Builder',
    classCount: 20,
    perClassCents: 2800,
    subtotalCents: 56000,
    currency: 'CAD',
    badge: 'Most Popular',
    sortOrder: 2,
    billingCadence: 'monthly',
  }),
  Object.freeze({
    id: 'engineer',
    name: 'Engineer',
    classCount: 36,
    perClassCents: 2600,
    subtotalCents: 93600,
    currency: 'CAD',
    badge: 'Best Value',
    sortOrder: 3,
    billingCadence: 'monthly',
  }),
])

// Fails fast (at import time) if any package's arithmetic is inconsistent,
// rather than silently mis-invoicing a family later.
for (const pkg of ROBOTICS_PACKAGES) {
  const expected = pkg.classCount * pkg.perClassCents
  if (expected !== pkg.subtotalCents) {
    throw new Error(
      `Robotics package "${pkg.id}" is inconsistent: ${pkg.classCount} × ${pkg.perClassCents} = ${expected}, but subtotalCents is ${pkg.subtotalCents}.`
    )
  }
}

const PACKAGES_BY_ID = new Map(ROBOTICS_PACKAGES.map(pkg => [pkg.id, pkg]))

// Sitewide class-package promotion. Not Firestore-driven (unlike per-program
// discounts) — this campaign applies to the fixed package catalogue itself,
// so it's configured here directly. Registrations already submitted keep
// their locked-in packageSnapshot regardless of later changes here.
//
// `active` is a real deadline, not a hand-flipped flag — the campaign ends
// naturally the night before classes begin (Sunday, September 13, 2026,
// 11:59 p.m. ET) rather than needing someone to remember to turn it off.
// It's a getter so it's re-evaluated on every access — this module can stay
// loaded in a warm server process for days, so a value baked in once at
// import time would keep the promo "on" past its deadline until the next
// deploy/cold start. Avoid extending this deadline after the fact: a promo
// advertised with a firm end date that then keeps sliding undermines the
// urgency (and the trust) it's meant to create.
const PROMO_ENDS_AT = '2026-09-13T23:59:59-04:00' // Sunday, Sep 13, 2026, 11:59:59 p.m. ET

export const PACKAGE_PROMO = Object.freeze({
  get active() {
    return Date.now() <= new Date(PROMO_ENDS_AT).getTime()
  },
  label: 'Back-to-School Offer: First Class Free',
  registerByLabel: 'Register by September 13, 2026. Limited spaces available.',
  endsAt: PROMO_ENDS_AT,
  discountClasses: 1,
})

export function isValidPackageId(value) {
  return typeof value === 'string' && PACKAGES_BY_ID.has(value)
}

/** Canonical lookup — the only place package pricing should be resolved from an ID. */
export function getRoboticsPackage(packageId) {
  return PACKAGES_BY_ID.get(packageId) ?? null
}

/** The promo discount (in cents) currently applied to a package, or 0 if the promo is inactive. */
export function getPackagePromoDiscountCents(pkg) {
  if (!pkg || !PACKAGE_PROMO.active) return 0
  return pkg.perClassCents * PACKAGE_PROMO.discountClasses
}

/** Package subtotal after the active promo discount, floored at 0. */
export function getDiscountedSubtotalCents(pkg) {
  if (!pkg) return 0
  return Math.max(0, pkg.subtotalCents - getPackagePromoDiscountCents(pkg))
}

/** Short, family-facing explanation of how a package is actually billed. */
export function getBillingCadenceLabel(pkg) {
  if (!pkg) return ''
  return pkg.billingCadence === 'upfront'
    ? `Paid upfront — one invoice covers all ${pkg.classCount} classes`
    : 'Monthly option available — billed only for the classes that fall in each month'
}

/** Builds the immutable snapshot stored on a registration/waitlist document. */
export function buildPackageSnapshot(packageId) {
  const pkg = getRoboticsPackage(packageId)
  if (!pkg) return null
  const promoDiscountCents = getPackagePromoDiscountCents(pkg)
  return {
    version: 3,
    id: pkg.id,
    name: pkg.name,
    classCount: pkg.classCount,
    perClassCents: pkg.perClassCents,
    subtotalCents: pkg.subtotalCents,
    currency: pkg.currency,
    billingCadence: pkg.billingCadence,
    promoLabel: promoDiscountCents > 0 ? PACKAGE_PROMO.label : null,
    promoDiscountCents,
  }
}
