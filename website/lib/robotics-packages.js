// Canonical robotics class-package catalogue. This is the single source of
// truth for package pricing — imported by both Next.js (client + server
// components) and Netlify Functions (submit-enrollment-request.js). Never
// duplicate these numbers elsewhere; a client-supplied price is never
// trusted, only a packageId is, and the server resolves everything here.
//
// There is currently no admin pricing-management interface — this file is
// the only place package prices are configured. Building one is a separate
// future phase; until then, price changes are code changes here.

// Package commitment (the class package the family is enrolling in) and
// payment scheduling (how they pay for it) are separate concepts. A package's
// `paymentOptions` only describes how it may be *paid for* — it never changes
// the class count, price, or the fact that a family is committing to the
// complete package. Every future package must declare its own
// `paymentOptions`; installment eligibility is never inferred from class
// count or price.
function paymentOptions({ installmentPlanEnabled = false, allowedInstallments = [] } = {}) {
  return Object.freeze({
    payInFullEnabled: true,
    installmentPlanEnabled,
    allowedInstallments: Object.freeze([...allowedInstallments]),
  })
}

// `regularSubtotalCents` is the package's bulk pay-in-full price (what you'd
// pay in full without the Back-to-School promotion). `promotionalPayInFullSubtotalCents`
// is a separate, explicit value (never derived from perClassCents/discountClasses
// at runtime) that only ever applies when paying in full during an active
// promotion.
//
// `installmentPerClassCents` is a DIFFERENT rate from the pay-in-full rate:
// paying by installments is priced at a standard per-class list rate, not
// the bulk per-package rate baked into `regularSubtotalCents`. Only
// `paymentOptions.payInFullEnabled` packages need `regularSubtotalCents`;
// only `paymentOptions.installmentPlanEnabled` packages need
// `installmentPerClassCents`. See resolvePackagePricing, which is the one
// place all of this is turned into "what does this family actually owe."
//
// Class packages are program-scoped: each Robotics program can have its own
// Builder/Engineer pricing (see PACKAGE_CATALOGS_BY_PROGRAM_ID below).
// Explorer is the one exception — it's an internal fallback/save-the-sale
// package (never shown publicly, not a "drop-in") shared identically across
// every program, so it's built once and reused in every catalogue.
const EXPLORER_PACKAGE = Object.freeze({
  id: 'explorer',
  name: 'Explorer',
  classCount: 10,
  perClassCents: 3000,
  regularSubtotalCents: 30000,
  currency: 'CAD',
  badge: null,
  sortOrder: 1,
  // Pay-in-full only, paid as a single upfront invoice for all classes.
  // Explorer's own per-class rate ($30) already equals the installment
  // list rate used for Builder/Engineer, which is why it's already
  // pay-in-full only rather than needing a separate installment rate.
  paymentOptions: paymentOptions(),
  installmentPerClassCents: null,
  // Not enrolled in the Back-to-School promotion. Must stay unchanged
  // unless a future configuration change here explicitly opts it in.
  promotionEligible: false,
  promotionalPayInFullSubtotalCents: null,
  // Internal fallback / save-the-sale package — intentionally not shown
  // in the public package grids (PackageChooser, PackagesPricingSection).
  // Still fully enabled everywhere else: valid packageId for direct/Shared
  // links, registration, checkout, and existing Explorer registrations
  // are completely unaffected. Flip this back to true to re-list it
  // publicly; nothing else needs to change.
  publicVisible: false,
})

/** Builds a [Explorer, Builder, Engineer] catalogue from just the two
 * program-specific packages, so every catalogue shares the exact same
 * Explorer object rather than duplicating it. */
function buildPackageCatalog({ builder, engineer }) {
  return Object.freeze([
    EXPLORER_PACKAGE,
    Object.freeze({ id: 'builder', name: 'Builder', classCount: 20, currency: 'CAD', sortOrder: 2, ...builder }),
    Object.freeze({ id: 'engineer', name: 'Engineer', classCount: 36, currency: 'CAD', sortOrder: 3, ...engineer }),
  ])
}

// Today's numbers — unchanged. This is what every Robotics program uses
// unless it has its own entry in PACKAGE_CATALOGS_BY_PROGRAM_ID below
// (currently just Smartivo). Bricks Challenge, Algo Play, and any future
// Robotics program must keep seeing exactly these prices.
const DEFAULT_PACKAGE_CATALOG = buildPackageCatalog({
  builder: {
    perClassCents: 2800,
    regularSubtotalCents: 56000,
    badge: null,
    paymentOptions: paymentOptions({ installmentPlanEnabled: true, allowedInstallments: [2, 3, 4] }),
    // $30/class list rate x 20 classes = $600.00 total when paying by
    // installments — higher than both the $560 regular and $532 promotional
    // pay-in-full prices, which is the incentive to pay in full.
    installmentPerClassCents: 3000,
    promotionEligible: true,
    promotionalPayInFullSubtotalCents: 53200,
    publicVisible: true,
  },
  engineer: {
    perClassCents: 2600,
    regularSubtotalCents: 93600,
    badge: 'Best Value',
    paymentOptions: paymentOptions({ installmentPlanEnabled: true, allowedInstallments: [2, 3, 4, 5, 6] }),
    // $30/class list rate x 36 classes = $1,080.00 total when paying by
    // installments — higher than both the $936 regular and $910 promotional
    // pay-in-full prices.
    installmentPerClassCents: 3000,
    promotionEligible: true,
    promotionalPayInFullSubtotalCents: 91000,
    publicVisible: true,
  },
})

// Smartivo-specific pricing (Back-to-School 2026 update). Builder/Engineer
// pay-in-full is the LOWER rate here — the opposite relationship from the
// default catalogue's installment/pay-in-full split, but the same schema:
// `perClassCents`/`regularSubtotalCents` is always the pay-in-full price,
// `installmentPerClassCents` is always the installment price.
const SMARTIVO_PACKAGE_CATALOG = buildPackageCatalog({
  builder: {
    perClassCents: 2600, // $26/class pay-in-full
    regularSubtotalCents: 52000, // $520
    badge: 'Most Popular',
    paymentOptions: paymentOptions({ installmentPlanEnabled: true, allowedInstallments: [2, 3, 4] }),
    installmentPerClassCents: 2800, // $28/class installment rate -> $560 total
    promotionEligible: true,
    // Back-to-School Launch Offer: first class free, i.e. regular minus one
    // pay-in-full class ($520 - $26 = $494).
    promotionalPayInFullSubtotalCents: 49400,
    publicVisible: true,
  },
  engineer: {
    perClassCents: 2400, // $24/class pay-in-full
    regularSubtotalCents: 86400, // $864
    badge: 'Best Value',
    paymentOptions: paymentOptions({ installmentPlanEnabled: true, allowedInstallments: [2, 3, 4, 5, 6] }),
    installmentPerClassCents: 2800, // $28/class installment rate -> $1,008 total
    promotionEligible: true,
    // $864 - $24 = $840.
    promotionalPayInFullSubtotalCents: 84000,
    publicVisible: true,
  },
})

// Keyed by the real Firestore `programs/{id}` document ID, NOT a slug —
// this project uses Firestore auto-generated IDs (see the same note on
// DEMO_ELIGIBLE_PROGRAM_IDS in lib/demo-eligibility.js). Must be updated
// here if the Smartivo program doc is ever deleted and recreated.
const SMARTIVO_PROGRAM_ID = 'cCdBSnKOgTBcO4ZIPXs4' // Smartivo

const PACKAGE_CATALOGS_BY_PROGRAM_ID = Object.freeze({
  [SMARTIVO_PROGRAM_ID]: SMARTIVO_PACKAGE_CATALOG,
})

/** The canonical class-package catalogue for a given program. Every Robotics
 * program not explicitly listed in PACKAGE_CATALOGS_BY_PROGRAM_ID falls back
 * to DEFAULT_PACKAGE_CATALOG, so adding a program-specific catalogue here
 * can never accidentally change another program's prices. */
function getPackageCatalog(programId) {
  return PACKAGE_CATALOGS_BY_PROGRAM_ID[programId] ?? DEFAULT_PACKAGE_CATALOG
}

/** Packages shown in public-facing package grids for `programId`. Explorer
 * stays fully enabled (resolvable by ID, bookable, invoiceable) — it's just
 * excluded from the default public listing so staff can still offer it
 * directly. */
export function getPubliclyVisiblePackages(programId) {
  return getPackageCatalog(programId).filter(pkg => pkg.publicVisible)
}

// Fails fast (at import time) if any package's arithmetic is inconsistent,
// rather than silently mis-invoicing a family later. Runs over every
// catalogue so a typo in a program-specific catalogue is caught immediately.
const ALL_PACKAGE_CATALOGS = [DEFAULT_PACKAGE_CATALOG, ...Object.values(PACKAGE_CATALOGS_BY_PROGRAM_ID)]
for (const catalog of ALL_PACKAGE_CATALOGS) {
  for (const pkg of catalog) {
    const expected = pkg.classCount * pkg.perClassCents
    if (expected !== pkg.regularSubtotalCents) {
      throw new Error(
        `Robotics package "${pkg.id}" is inconsistent: ${pkg.classCount} × ${pkg.perClassCents} = ${expected}, but regularSubtotalCents is ${pkg.regularSubtotalCents}.`
      )
    }
    if (pkg.promotionEligible) {
      const promo = pkg.promotionalPayInFullSubtotalCents
      if (!Number.isSafeInteger(promo) || promo <= 0 || promo >= pkg.regularSubtotalCents) {
        throw new Error(
          `Robotics package "${pkg.id}" is promotion-eligible but promotionalPayInFullSubtotalCents (${promo}) is missing or not less than regularSubtotalCents (${pkg.regularSubtotalCents}).`
        )
      }
    }
    if (pkg.paymentOptions.installmentPlanEnabled && !Number.isSafeInteger(pkg.installmentPerClassCents)) {
      throw new Error(
        `Robotics package "${pkg.id}" has installments enabled but no valid installmentPerClassCents configured.`
      )
    }
  }
}

// The $10 Young Engineers Demo Class is a separate, standalone product — not
// a class package. It is intentionally NOT added to any package catalogue
// above: their import-time arithmetic self-check (classCount * perClassCents
// === regularSubtotalCents) assumes a multi-class package, which a single
// $10 session would violate. Price is always resolved server-side from
// here, never from anything the browser sends.
export const DEMO_PACKAGE = Object.freeze({
  id: 'demo',
  name: '$10 Demo Class',
  priceCents: 1000,
  currency: 'CAD',
})

/** Canonical, server-safe source of the $10 demo price. Mirrors the
 * "resolve pricing from a code-configured source, never the client" pattern
 * used by resolvePackagePricing above. */
export function getDemoPricing() {
  return { priceCents: DEMO_PACKAGE.priceCents, currency: DEMO_PACKAGE.currency }
}

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
})

export function isValidPackageId(programId, packageId) {
  return typeof packageId === 'string' && getRoboticsPackage(programId, packageId) !== null
}

/** Canonical lookup — the only place package pricing should be resolved from
 * a programId + packageId. Resolves against that program's own catalogue
 * (see PACKAGE_CATALOGS_BY_PROGRAM_ID), falling back to
 * DEFAULT_PACKAGE_CATALOG for any program without its own pricing. */
export function getRoboticsPackage(programId, packageId) {
  if (typeof packageId !== 'string') return null
  return getPackageCatalog(programId).find(pkg => pkg.id === packageId) ?? null
}

/** Short, family-facing explanation of how a package may be paid for. The
 * package commitment (class count, price) never changes based on how the
 * family chooses to pay — this is scheduling language only, never "monthly
 * subscription" / "monthly fee" / cancellable-month-to-month language. */
export function getPaymentOptionsLabel(pkg) {
  if (!pkg) return ''
  return pkg.paymentOptions?.installmentPlanEnabled
    ? 'Pay in full or choose an installment plan.'
    : `Paid in full — one invoice covers all ${pkg.classCount} classes`
}

/** The installment counts a package actually allows, or [] if installments
 * aren't offered for it at all. Never inferred from class count/price. */
export function getAllowedInstallmentCounts(pkg) {
  if (!pkg?.paymentOptions?.installmentPlanEnabled) return []
  return [...pkg.paymentOptions.allowedInstallments]
}

/** The one canonical, server-safe pricing resolver. Given a package and a
 * payment method, returns exactly what the family owes and whether the
 * Back-to-School promotion applied — this is the single source of truth for
 * "how much" everywhere in the app (package cards, the payment-preference
 * step, review screens, server snapshots, emails).
 *
 * THE CORE BUSINESS RULE: the promotion is a pay-in-full incentive only, and
 * installments are priced at the standard per-class list rate rather than
 * the bulk pay-in-full rate — both push toward paying in full.
 *   - method 'pay_in_full', promo active + package promotion-eligible:
 *       payableSubtotalCents = the package's explicit promotional price.
 *   - method 'pay_in_full', promo inactive (or package not eligible):
 *       payableSubtotalCents = the package's regular (bulk) price.
 *   - method 'installments', ALWAYS, promo active or not:
 *       payableSubtotalCents = classCount × installmentPerClassCents (the
 *       list rate, e.g. $30/class) — never the bulk regularSubtotalCents,
 *       and never discounted by the promotion, even while it's active.
 *
 * Returns null for an unknown package or method. */
export function resolvePackagePricing(pkg, method) {
  if (!pkg) return null

  if (method === 'pay_in_full') {
    const regularSubtotalCents = pkg.regularSubtotalCents
    const promotionApplied = Boolean(pkg.promotionEligible) && PACKAGE_PROMO.active
      && Number.isSafeInteger(pkg.promotionalPayInFullSubtotalCents)
    const payableSubtotalCents = promotionApplied ? pkg.promotionalPayInFullSubtotalCents : regularSubtotalCents
    return {
      method: 'pay_in_full',
      regularSubtotalCents,
      payableSubtotalCents,
      promotionApplied,
      promotionDiscountCents: promotionApplied ? Math.max(0, regularSubtotalCents - payableSubtotalCents) : 0,
    }
  }

  if (method === 'installments') {
    // The list-rate total, not the bulk regularSubtotalCents. The promotion
    // never reaches an installment plan, regardless of whether it's
    // currently active.
    const installmentSubtotalCents = pkg.classCount * pkg.installmentPerClassCents
    return {
      method: 'installments',
      regularSubtotalCents: installmentSubtotalCents,
      payableSubtotalCents: installmentSubtotalCents,
      promotionApplied: false,
      promotionDiscountCents: 0,
    }
  }

  return null
}

/** How much a family saves by paying in full instead of choosing an
 * installment plan, in cents — the gap between the installment list-rate
 * total and whatever the pay-in-full price actually is right now (promo
 * price while the promotion is active, regular price once it ends). Floored
 * at 0 so a misconfigured/edge-case package never reports a negative
 * "savings". Returns 0 for a package that doesn't offer installments at all
 * (there's nothing to save against). */
export function getPayInFullSavingsCents(pkg) {
  if (!pkg?.paymentOptions?.installmentPlanEnabled) return 0
  const installments = resolvePackagePricing(pkg, 'installments')
  const payInFull = resolvePackagePricing(pkg, 'pay_in_full')
  return Math.max(0, installments.payableSubtotalCents - payInFull.payableSubtotalCents)
}

/** Builds the immutable snapshot stored on a registration/waitlist document.
 *
 * Version history:
 *   v3 (legacy) — included `billingCadence: 'upfront' | 'monthly'`.
 *   v4 (legacy) — replaced `billingCadence` with `paymentOptions` and a flat
 *   `subtotalCents`/`perClassCents` pricing shape; `promoDiscountCents` on
 *   this version was computed the same way regardless of payment method
 *   (the bug this version fixes).
 *   v5 (current) — replaces the single `subtotalCents` with explicit
 *   `regularSubtotalCents` / `promotionalPayInFullSubtotalCents` +
 *   `promotionEligible`/`promotionName`, matching resolvePackagePricing's
 *   method-aware model. Older snapshots are never rewritten; readers must
 *   treat all v5-only fields as optional/absent on v3/v4 documents. */
export function buildPackageSnapshot(programId, packageId) {
  const pkg = getRoboticsPackage(programId, packageId)
  if (!pkg) return null
  return {
    version: 5,
    id: pkg.id,
    name: pkg.name,
    classCount: pkg.classCount,
    perClassCents: pkg.perClassCents,
    regularSubtotalCents: pkg.regularSubtotalCents,
    promotionalPayInFullSubtotalCents: pkg.promotionEligible ? pkg.promotionalPayInFullSubtotalCents : null,
    currency: pkg.currency,
    paymentOptions: {
      payInFullEnabled: pkg.paymentOptions.payInFullEnabled,
      installmentPlanEnabled: pkg.paymentOptions.installmentPlanEnabled,
      allowedInstallments: [...pkg.paymentOptions.allowedInstallments],
    },
    promotionEligible: pkg.promotionEligible,
    promotionName: pkg.promotionEligible ? PACKAGE_PROMO.label : null,
  }
}

/** Splits `totalCents` into `installmentCount` integer-cent installments that
 * sum exactly back to `totalCents`. The first N-1 installments are the
 * rounded-even share; the final installment absorbs the remainder so the sum
 * is always exact (e.g. $560.00 / 3 -> [$186.67, $186.67, $186.66]). */
export function computeInstallmentAmountsCents(totalCents, installmentCount) {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
    throw new Error(`computeInstallmentAmountsCents: invalid totalCents (${totalCents})`)
  }
  if (!Number.isSafeInteger(installmentCount) || installmentCount < 1) {
    throw new Error(`computeInstallmentAmountsCents: invalid installmentCount (${installmentCount})`)
  }
  const regularInstallment = Math.round(totalCents / installmentCount)
  const amounts = new Array(installmentCount - 1).fill(regularInstallment)
  const finalInstallment = totalCents - regularInstallment * (installmentCount - 1)
  amounts.push(finalInstallment)
  return amounts
}

/** Server-authoritative build of the normalized `paymentPreferenceSnapshot`
 * stored on an enrollment request. `packageId`/`paymentPreference.method`/
 * `paymentPreference.installmentCount` are the only client-supplied inputs
 * trusted here — every amount is derived from resolvePackagePricing, never
 * from anything the browser sent. Returns null if the package is unknown or
 * the requested method/installment count isn't valid for that package
 * (pay-in-full is always valid for every package).
 *
 * Version history:
 *   v1 (legacy) — a single `effectiveSubtotalCents` applied the promotion
 *   to both pay-in-full AND installments, which was incorrect: installment
 *   plans must always use the regular price.
 *   v2 (current) — splits `regularSubtotalCents` (always true) from
 *   `payableSubtotalCents` (method-dependent), and adds explicit
 *   `promotionApplied`/`promotionDiscountCents` so nothing downstream has to
 *   re-derive whether the promotion applied from the numbers alone. */
export function buildPaymentPreferenceSnapshot(programId, packageId, paymentPreference) {
  const pkg = getRoboticsPackage(programId, packageId)
  if (!pkg) return null

  const method = paymentPreference?.method

  if (method === 'pay_in_full') {
    const pricing = resolvePackagePricing(pkg, 'pay_in_full')
    return {
      version: 2,
      method: 'pay_in_full',
      installmentCount: 1,
      regularSubtotalCents: pricing.regularSubtotalCents,
      payableSubtotalCents: pricing.payableSubtotalCents,
      installmentAmountsCents: [pricing.payableSubtotalCents],
      promotionApplied: pricing.promotionApplied,
      promotionDiscountCents: pricing.promotionDiscountCents,
      currency: pkg.currency,
    }
  }

  if (method === 'installments') {
    const installmentCount = Number(paymentPreference?.installmentCount)
    const allowed = getAllowedInstallmentCounts(pkg)
    if (!allowed.includes(installmentCount)) return null
    const pricing = resolvePackagePricing(pkg, 'installments')
    return {
      version: 2,
      method: 'installments',
      installmentCount,
      regularSubtotalCents: pricing.regularSubtotalCents,
      payableSubtotalCents: pricing.payableSubtotalCents,
      installmentAmountsCents: computeInstallmentAmountsCents(pricing.payableSubtotalCents, installmentCount),
      promotionApplied: pricing.promotionApplied,
      promotionDiscountCents: pricing.promotionDiscountCents,
      currency: pkg.currency,
    }
  }

  return null
}
