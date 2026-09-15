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
// `paymentOptions`; it is never inferred from class count or price.
//
// There is no installment-plan option. Regular/Builder/Engineer may each be
// paid in full or billed monthly; Explorer (internal only) is paid in full.
// Do not reintroduce a per-package installment rate without also restoring
// the UI, the Netlify validation branch, and the acknowledgement-email
// rendering that were removed alongside it.
function paymentOptions({ payInFullEnabled = true, recurringMonthlyEnabled = false } = {}) {
  return Object.freeze({ payInFullEnabled, recurringMonthlyEnabled })
}

// `regularSubtotalCents` is the package's pay-in-full price. Only
// `paymentOptions.payInFullEnabled` packages need it. See
// resolvePackagePricing, which is the one place all of this is turned into
// "what does this family actually owe."
//
// NO PROMOTION IS CURRENTLY RUNNING. The Back-to-School "first class free"
// campaign has been removed: every package is `promotionEligible: false`
// with a null `promotionalPayInFullSubtotalCents`. The promotion *mechanism*
// below is intentionally kept so a future campaign is a data change here
// (set the two fields plus PACKAGE_PROMO) rather than a rewrite — but until
// then nothing downstream should render promotional copy, because
// `promotionApplied` can never be true.
//
// Class packages are program-scoped: each Robotics program can have its own
// Builder/Engineer pricing (see PACKAGE_CATALOGS_BY_PROGRAM_ID below).
// Explorer is the one exception — it's an internal fallback/save-the-sale
// package (never shown publicly, not a "drop-in") shared identically across
// every program, so it's built once and reused in every catalogue.
const EXPLORER_PACKAGE = Object.freeze({
  id: 'explorer',
  name: 'Explorer',
  planType: 'fixed_learning_path',
  classCount: 10,
  perClassCents: 3000,
  regularSubtotalCents: 30000,
  currency: 'CAD',
  badge: null,
  sortOrder: 2,
  // Pay-in-full only, paid as a single upfront invoice for all classes.
  paymentOptions: paymentOptions(),
  // No promotion is running; see the PACKAGE_PROMO note above.
  promotionEligible: false,
  promotionalPayInFullSubtotalCents: null,
  // Internal fallback / save-the-sale package — intentionally not shown
  // in the public package grids (PackageChooser, RoboticsPricingSection).
  // Still fully enabled everywhere else: valid packageId for direct/Shared
  // links, registration, checkout, and existing Explorer registrations
  // are completely unaffected. Flip this back to true to re-list it
  // publicly; nothing else needs to change.
  publicVisible: false,
})

// The shortest-commitment public option: a fixed 10-class package at the
// program's standard (undiscounted) per-class rate. This is the rate every
// other package's savings are quoted against, so `perClassCents` here is the
// program's rate card "Regular" column.
//
// Regular used to be a `rolling_monthly` plan with no class count, billed for
// whatever classes happened to land in a calendar month. It is now a normal
// `fixed_learning_path` package like Builder and Engineer — families commit
// to 10 classes and may pay in full or have that total averaged across the
// real billing months. The `rolling_monthly` code paths in this module and
// in lib/robotics-monthly-tuition.js are deliberately left intact: no
// catalogue package uses them today, but historical registrations carry
// `rolling_monthly` payment-preference snapshots (v3, `variesByMonth: true`)
// that readers must still render correctly.
function buildRegularPackage(perClassCents) {
  return Object.freeze({
  id: 'regular',
  name: 'Regular',
  planType: 'fixed_learning_path',
  classCount: 10,
  perClassCents,
  regularSubtotalCents: perClassCents * 10,
  currency: 'CAD',
  badge: null,
  sortOrder: 1,
  minimumClassCommitment: 10,
  paymentOptions: paymentOptions({ payInFullEnabled: true, recurringMonthlyEnabled: true }),
  promotionEligible: false,
  promotionalPayInFullSubtotalCents: null,
  publicVisible: true,
  })
}

/** Builds a [Regular, Explorer, Builder, Engineer] catalogue from just the
 * program-specific packages, so every catalogue shares the exact same
 * Explorer object rather than duplicating it. Regular is built per-program
 * because its per-class rate is program-scoped too (60-minute Smartivo and
 * 75-minute Bricks/Algo classes are priced differently). */
function buildPackageCatalog({ regularPerClassCents, builder, engineer }) {
  return Object.freeze([
    buildRegularPackage(regularPerClassCents),
    EXPLORER_PACKAGE,
    Object.freeze({
      id: 'builder',
      name: 'Builder',
      planType: 'fixed_learning_path',
      classCount: 20,
      currency: 'CAD',
      sortOrder: 3,
      minimumClassCommitment: 20,
      ...builder,
    }),
    Object.freeze({
      id: 'engineer',
      name: 'Engineer',
      planType: 'fixed_learning_path',
      classCount: 36,
      currency: 'CAD',
      sortOrder: 4,
      minimumClassCommitment: 36,
      ...engineer,
    }),
  ])
}

// The 75-minute-class rate card ($32 Regular / $28 Builder / $25 Engineer).
// This is what every Robotics program uses unless it has its own entry in
// PACKAGE_CATALOGS_BY_PROGRAM_ID below (currently just Smartivo) — i.e.
// Bricks Challenge, Algo Play, and any future Robotics program.
const DEFAULT_PACKAGE_CATALOG = buildPackageCatalog({
  regularPerClassCents: 3200, // $32/class
  builder: {
    perClassCents: 2800, // $28/class pay-in-full
    regularSubtotalCents: 56000, // $560
    badge: 'Most Popular',
    paymentOptions: paymentOptions({ recurringMonthlyEnabled: true }),
    promotionEligible: false,
    promotionalPayInFullSubtotalCents: null,
    publicVisible: true,
  },
  engineer: {
    perClassCents: 2500, // $25/class pay-in-full
    regularSubtotalCents: 90000, // $900
    badge: 'Best Value',
    paymentOptions: paymentOptions({ recurringMonthlyEnabled: true }),
    promotionEligible: false,
    promotionalPayInFullSubtotalCents: null,
    publicVisible: true,
  },
})

// Smartivo-specific pricing — the 60-minute-class rate card ($30 Regular /
// $26 Builder / $24 Engineer). Smartivo classes run 60 minutes vs the
// 75-minute Bricks Challenge / Algo Play classes priced in
// DEFAULT_PACKAGE_CATALOG above, which is why it keeps its own catalogue.
const SMARTIVO_PACKAGE_CATALOG = buildPackageCatalog({
  regularPerClassCents: 3000, // $30/class
  builder: {
    perClassCents: 2600, // $26/class pay-in-full
    regularSubtotalCents: 52000, // $520
    badge: 'Most Popular',
    paymentOptions: paymentOptions({ recurringMonthlyEnabled: true }),
    promotionEligible: false,
    promotionalPayInFullSubtotalCents: null,
    publicVisible: true,
  },
  engineer: {
    perClassCents: 2400, // $24/class pay-in-full
    regularSubtotalCents: 86400, // $864
    badge: 'Best Value',
    paymentOptions: paymentOptions({ recurringMonthlyEnabled: true }),
    promotionEligible: false,
    promotionalPayInFullSubtotalCents: null,
    publicVisible: true,
  },
})

// Keyed by the real Firestore `programs/{id}` document ID, NOT a slug —
// this project uses Firestore auto-generated IDs (see the same note on
// DEMO_ELIGIBLE_PROGRAM_IDS in lib/demo-eligibility.js). Must be updated
// here if the Smartivo program doc is ever deleted and recreated.
const SMARTIVO_PROGRAM_ID = 'cCdBSnKOgTBcO4ZIPXs4' // Smartivo

// The licensed-program slug from lib/robotics-content.ts, keyed here as well
// so marketing surfaces can price a program before (or without) resolving its
// Firestore document. Registration and checkout always pass the real
// Firestore id; this alias exists so the /robotics rate card can never quote
// the 75-minute rates for a 60-minute Smartivo class just because the
// Firestore lookup came back empty.
const SMARTIVO_LICENSED_SLUG = 'smartivo'

const PACKAGE_CATALOGS_BY_PROGRAM_ID = Object.freeze({
  [SMARTIVO_PROGRAM_ID]: SMARTIVO_PACKAGE_CATALOG,
  [SMARTIVO_LICENSED_SLUG]: SMARTIVO_PACKAGE_CATALOG,
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
    // Regular (`rolling_monthly`) has no fixed class count or total to check
    // against — its amount only exists once a real offering schedule is
    // known (see lib/robotics-monthly-tuition.js).
    if (pkg.planType === 'rolling_monthly') continue
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
// THERE IS NO ACTIVE PROMOTION. The Back-to-School "first class free"
// campaign ran to September 13, 2026 and has been retired: `active` is
// permanently false and `label` is null, and no package is
// `promotionEligible` any more, so `resolvePackagePricing` can never report
// `promotionApplied: true`.
//
// To run a future campaign, give this object a real `endsAt` deadline and
// restore the date-based getter below (a real deadline, not a hand-flipped
// flag, so the campaign ends on its own rather than needing someone to
// remember), then opt individual packages in via `promotionEligible` +
// `promotionalPayInFullSubtotalCents`. The promotional copy that used to
// render off these fields was removed from the register page, the booking
// catalogue and the acknowledgement email and would need restoring too.
export const PACKAGE_PROMO = Object.freeze({
  active: false,
  label: null,
  registerByLabel: null,
  endsAt: null,
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
  if (pkg.paymentOptions?.recurringMonthlyEnabled) {
    return pkg.planType === 'rolling_monthly'
      ? 'Billed monthly for classes actually scheduled that month.'
      : `Billed monthly, averaged across your ${pkg.classCount}-class learning path.`
  }
  return `Paid in full — one invoice covers all ${pkg.classCount} classes`
}

/** The one canonical, server-safe pricing resolver. Given a package and a
 * payment method, returns exactly what the family owes and whether a
 * promotion applied (never, while none is configured — see PACKAGE_PROMO) —
 * this is the single source of truth for "how much" everywhere in the app (package cards, the payment-preference
 * step, review screens, server snapshots, emails).
 *
 * THE CORE BUSINESS RULE: the promotion is a pay-in-full incentive only.
 *   - method 'pay_in_full', promo active + package promotion-eligible:
 *       payableSubtotalCents = the package's explicit promotional price.
 *   - method 'pay_in_full', promo inactive (or package not eligible) — the
 *       only case that can occur today:
 *       payableSubtotalCents = the package's regular (bulk) price.
 *   - method 'recurring_monthly', ALWAYS, promo active or not:
 *       - `fixed_learning_path` packages (Regular/Builder/Engineer):
 *         payableSubtotalCents = classCount × perClassCents — the package's
 *         own rate (e.g. $28/class). This is the total that gets averaged
 *         across billing months (see lib/robotics-monthly-tuition.js), not a
 *         separately-priced payment method.
 *       - `rolling_monthly` packages (none in the catalogue today): there
 *         is no fixed total —
 *         the family is billed for whatever classes actually land in one
 *         calendar month. Requires `context.classesInMonth` (a real count
 *         from an actual offering schedule); throws rather than guessing if
 *         it's missing, since a monthly amount for Regular must never be
 *         invented.
 *
 * Returns null for an unknown package or method. */
export function resolvePackagePricing(pkg, method, context = {}) {
  if (!pkg) return null

  if (method === 'pay_in_full') {
    const regularSubtotalCents = pkg.regularSubtotalCents
    // Always false while no campaign is configured — every package is
    // `promotionEligible: false` and PACKAGE_PROMO.active is false.
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

  if (method === 'recurring_monthly') {
    if (pkg.planType === 'rolling_monthly') {
      const { classesInMonth } = context
      if (!Number.isSafeInteger(classesInMonth) || classesInMonth < 0) {
        throw new Error(
          `resolvePackagePricing: "recurring_monthly" for rolling_monthly package "${pkg.id}" requires context.classesInMonth from a real offering schedule (got ${classesInMonth}).`
        )
      }
      const payableSubtotalCents = classesInMonth * pkg.perClassCents
      return {
        method: 'recurring_monthly',
        regularSubtotalCents: payableSubtotalCents,
        payableSubtotalCents,
        promotionApplied: false,
        promotionDiscountCents: 0,
      }
    }

    // fixed_learning_path (Regular/Builder/Engineer): the full path total at
    // the package's own per-class rate — never promo-discounted.
    const pathTotalCents = pkg.classCount * pkg.perClassCents
    return {
      method: 'recurring_monthly',
      regularSubtotalCents: pathTotalCents,
      payableSubtotalCents: pathTotalCents,
      promotionApplied: false,
      promotionDiscountCents: 0,
    }
  }

  return null
}

/** Builds the immutable snapshot stored on a registration/waitlist document.
 *
 * Version history:
 *   v3 (legacy) — included `billingCadence: 'upfront' | 'monthly'`.
 *   v4 (legacy) — replaced `billingCadence` with `paymentOptions` and a flat
 *   `subtotalCents`/`perClassCents` pricing shape; `promoDiscountCents` on
 *   this version was computed the same way regardless of payment method
 *   (the bug this version fixes).
 *   v5 (legacy) — replaces the single `subtotalCents` with explicit
 *   `regularSubtotalCents` / `promotionalPayInFullSubtotalCents` +
 *   `promotionEligible`/`promotionName`, matching resolvePackagePricing's
 *   method-aware model.
 *   v6 (current) — drops `paymentOptions.installmentPlanEnabled` /
 *   `allowedInstallments` now that no package offers an installment plan.
 *   Older snapshots are never rewritten; readers must treat all fields
 *   added or removed by a later version as optional on earlier documents. */
export function buildPackageSnapshot(programId, packageId) {
  const pkg = getRoboticsPackage(programId, packageId)
  if (!pkg) return null
  return {
    version: 6,
    id: pkg.id,
    name: pkg.name,
    classCount: pkg.classCount,
    perClassCents: pkg.perClassCents,
    regularSubtotalCents: pkg.regularSubtotalCents,
    promotionalPayInFullSubtotalCents: pkg.promotionEligible ? pkg.promotionalPayInFullSubtotalCents : null,
    currency: pkg.currency,
    paymentOptions: {
      payInFullEnabled: pkg.paymentOptions.payInFullEnabled,
      recurringMonthlyEnabled: pkg.paymentOptions.recurringMonthlyEnabled,
    },
    promotionEligible: pkg.promotionEligible,
    // Always null today — no package is promotion-eligible and
    // PACKAGE_PROMO carries no label. Historical snapshots keep whatever
    // promotion name was in force when they were written.
    promotionName: pkg.promotionEligible ? PACKAGE_PROMO.label : null,
  }
}

/** Splits `totalCents` into `installmentCount` integer-cent parts that sum
 * exactly back to `totalCents`. The first N-1 are the rounded-even share;
 * the final one absorbs the remainder so the sum is always exact
 * (e.g. $560.00 / 3 -> [$186.67, $186.67, $186.66]).
 *
 * Despite the name, this is NOT the removed installment plan — it is the
 * monthly-tuition averaging helper, used to spread a learning path's total
 * across its real billing months (see lib/robotics-monthly-tuition.js). */
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
 * `paymentPreference.method` is the only client-supplied input
 * trusted here — every amount is derived from resolvePackagePricing, never
 * from anything the browser sent. `context` carries server-recomputed
 * schedule facts needed for `recurring_monthly` (billingMonthCount for a
 * fixed_learning_path package, or classesInMonth/billingMonthLabel for
 * Regular) — always derived from a real offering schedule by the caller
 * (see lib/robotics-monthly-tuition.js), never trusted from the browser.
 * Returns null if the package is unknown or the requested method isn't
 * valid for that package (pay-in-full is always valid for every package).
 *
 * Version history:
 *   v1 (legacy) — a single `effectiveSubtotalCents` applied the promotion
 *   to both pay-in-full AND installments, which was incorrect: installment
 *   plans must always use the regular price. (Installment plans have since
 *   been removed entirely; `method: 'installments'` is no longer accepted,
 *   but historical v1/v2 documents that carry it are never rewritten.)
 *   v2 (current for pay_in_full) — splits `regularSubtotalCents`
 *   (always true) from `payableSubtotalCents` (method-dependent), and adds
 *   explicit `promotionApplied`/`promotionDiscountCents` so nothing
 *   downstream has to re-derive whether the promotion applied from the
 *   numbers alone.
 *   v3 (current for recurring_monthly only) — adds `billingMonthCount`/
 *   `monthlyAmountsCents` for a fixed_learning_path package's averaged
 *   tuition, or `classesInMonth`/`billingMonthLabel`/`variesByMonth: true`
 *   for Regular's single-month amount. pay_in_full snapshots are untouched
 *   and remain v2. */
export function buildPaymentPreferenceSnapshot(programId, packageId, paymentPreference, context = {}) {
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

  if (method === 'recurring_monthly') {
    if (!pkg.paymentOptions.recurringMonthlyEnabled) return null

    if (pkg.planType === 'rolling_monthly') {
      const classesInMonth = Number(context.classesInMonth)
      const billingMonthLabel = context.billingMonthLabel
      if (!Number.isSafeInteger(classesInMonth) || classesInMonth < 0 || typeof billingMonthLabel !== 'string') {
        return null
      }
      const pricing = resolvePackagePricing(pkg, 'recurring_monthly', { classesInMonth })
      return {
        version: 3,
        method: 'recurring_monthly',
        classesInMonth,
        billingMonthLabel,
        variesByMonth: true,
        regularSubtotalCents: pricing.regularSubtotalCents,
        payableSubtotalCents: pricing.payableSubtotalCents,
        promotionApplied: pricing.promotionApplied,
        promotionDiscountCents: pricing.promotionDiscountCents,
        currency: pkg.currency,
      }
    }

    // fixed_learning_path (Builder/Engineer): averaged across the real
    // billing-month count for this offering's schedule, computed by the
    // caller (see getLearningPathMonthlyTuition) and passed in — never
    // guessed here.
    const billingMonthCount = Number(context.billingMonthCount)
    if (!Number.isSafeInteger(billingMonthCount) || billingMonthCount < 1) return null
    const pricing = resolvePackagePricing(pkg, 'recurring_monthly')
    return {
      version: 3,
      method: 'recurring_monthly',
      billingMonthCount,
      variesByMonth: false,
      regularSubtotalCents: pricing.regularSubtotalCents,
      payableSubtotalCents: pricing.payableSubtotalCents,
      monthlyAmountsCents: computeInstallmentAmountsCents(pricing.payableSubtotalCents, billingMonthCount),
      promotionApplied: pricing.promotionApplied,
      promotionDiscountCents: pricing.promotionDiscountCents,
      currency: pkg.currency,
    }
  }

  return null
}
