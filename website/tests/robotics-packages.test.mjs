import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PACKAGE_PROMO,
  isValidPackageId,
  getRoboticsPackage,
  getPubliclyVisiblePackages,
  getPaymentOptionsLabel,
  getAllowedInstallmentCounts,
  resolvePackagePricing,
  getPayInFullSavingsCents,
  computeInstallmentAmountsCents,
  buildPackageSnapshot,
  buildPaymentPreferenceSnapshot,
} from '../lib/robotics-packages.js'

// Must match SMARTIVO_PROGRAM_ID in lib/robotics-packages.js.
const SMARTIVO_PROGRAM_ID = 'cCdBSnKOgTBcO4ZIPXs4'
const ALL_PACKAGE_IDS = ['regular', 'explorer', 'builder', 'engineer']

function allPackages(programId) {
  return ALL_PACKAGE_IDS.map(id => getRoboticsPackage(programId, id))
}

test('every fixed_learning_path package regular subtotal equals classCount * perClassCents; Regular has no fixed total', () => {
  for (const pkg of allPackages(undefined)) {
    if (pkg.planType === 'rolling_monthly') {
      assert.equal(pkg.classCount, null)
      assert.equal(pkg.regularSubtotalCents, null)
      continue
    }
    assert.equal(pkg.classCount * pkg.perClassCents, pkg.regularSubtotalCents, `${pkg.id} arithmetic mismatch`)
  }
})

test('exact default-catalogue values match the spec', () => {
  assert.deepEqual(
    allPackages(undefined).map(p => [p.id, p.classCount, p.perClassCents, p.regularSubtotalCents, p.promotionalPayInFullSubtotalCents, p.installmentPerClassCents, p.badge]),
    [
      ['regular', null, 3000, null, null, null, null],
      ['explorer', 10, 3000, 30000, null, null, null],
      ['builder', 20, 2800, 56000, 53200, 3000, null],
      ['engineer', 36, 2600, 93600, 91000, 3000, 'Best Value'],
    ]
  )
})

test('Smartivo catalogue matches the approved 2026 rate update ($28 Builder / $26 Engineer, same as the default catalogue)', () => {
  assert.deepEqual(
    ['builder', 'engineer'].map(id => {
      const p = getRoboticsPackage(SMARTIVO_PROGRAM_ID, id)
      return [p.id, p.classCount, p.perClassCents, p.regularSubtotalCents, p.promotionalPayInFullSubtotalCents, p.installmentPerClassCents, p.badge]
    }),
    [
      ['builder', 20, 2800, 56000, 53200, 3000, 'Most Popular'],
      ['engineer', 36, 2600, 93600, 91000, 3000, 'Best Value'],
    ]
  )
})

test('Builder and Engineer payment-option configuration matches the spec (pay-in-full, installments, and recurring monthly, no promo on the latter two)', () => {
  const builder = getRoboticsPackage(undefined, 'builder')
  assert.deepEqual(builder.paymentOptions, {
    payInFullEnabled: true,
    installmentPlanEnabled: true,
    allowedInstallments: [2, 3, 4],
    recurringMonthlyEnabled: true,
  })

  const engineer = getRoboticsPackage(undefined, 'engineer')
  assert.deepEqual(engineer.paymentOptions, {
    payInFullEnabled: true,
    installmentPlanEnabled: true,
    allowedInstallments: [2, 3, 4, 5, 6],
    recurringMonthlyEnabled: true,
  })
})

test('Regular has no pay-in-full or installment option, only recurring monthly, and is never promotion-eligible', () => {
  const regular = getRoboticsPackage(undefined, 'regular')
  assert.deepEqual(regular.paymentOptions, {
    payInFullEnabled: false,
    installmentPlanEnabled: false,
    allowedInstallments: [],
    recurringMonthlyEnabled: true,
  })
  assert.equal(regular.planType, 'rolling_monthly')
  assert.equal(regular.promotionEligible, false)
  assert.equal(regular.publicVisible, true)
  assert.deepEqual(getAllowedInstallmentCounts(regular), [])
})

test('Explorer stays pay-in-full only, private, and promotion-ineligible unless explicitly configured otherwise', () => {
  const explorer = getRoboticsPackage(undefined, 'explorer')
  assert.deepEqual(explorer.paymentOptions, {
    payInFullEnabled: true,
    installmentPlanEnabled: false,
    allowedInstallments: [],
    recurringMonthlyEnabled: false,
  })
  assert.deepEqual(getAllowedInstallmentCounts(explorer), [])
  assert.equal(explorer.promotionEligible, false)
  assert.equal(explorer.publicVisible, false)

  // Not eligible for the promotion regardless of the promo window, and its
  // pay-in-full price is always the regular price.
  const pricing = resolvePackagePricing(explorer, 'pay_in_full')
  assert.equal(pricing.promotionApplied, false)
  assert.equal(pricing.payableSubtotalCents, explorer.regularSubtotalCents)
  // No installment option at all, so there's nothing to "save" against.
  assert.equal(getPayInFullSavingsCents(explorer), 0)
})

test('Explorer is enabled system-wide but excluded from the public package grid', () => {
  assert.equal(isValidPackageId(undefined, 'explorer'), true)
  assert.ok(getRoboticsPackage(undefined, 'explorer'), 'Explorer must still resolve by id for direct/shared links, registration, and checkout')
  assert.equal(
    getPubliclyVisiblePackages(undefined).some(p => p.id === 'explorer'),
    false,
    'Explorer must not appear in the public package grid'
  )
  assert.deepEqual(
    getPubliclyVisiblePackages(undefined).map(p => p.id),
    ['regular', 'builder', 'engineer'],
  )
})

test('isValidPackageId only accepts known ids', () => {
  assert.equal(isValidPackageId(undefined, 'regular'), true)
  assert.equal(isValidPackageId(undefined, 'explorer'), true)
  assert.equal(isValidPackageId(undefined, 'builder'), true)
  assert.equal(isValidPackageId(undefined, 'engineer'), true)
  assert.equal(isValidPackageId(undefined, 'bogus'), false)
  assert.equal(isValidPackageId(undefined, ''), false)
  assert.equal(isValidPackageId(undefined, undefined), false)
  assert.equal(isValidPackageId(undefined, null), false)
  assert.equal(isValidPackageId(undefined, { id: 'builder' }), false)
})

test('getRoboticsPackage returns null for unknown ids', () => {
  assert.equal(getRoboticsPackage(undefined, 'bogus'), null)
  assert.equal(getRoboticsPackage(undefined, 'builder')?.name, 'Builder')
})

test('package objects are frozen (cannot be mutated at runtime)', () => {
  const pkg = getRoboticsPackage(undefined, 'explorer')
  assert.throws(() => { pkg.perClassCents = 1 }, /Cannot assign to read only property|frozen/i)
  assert.throws(() => { pkg.paymentOptions.installmentPlanEnabled = true }, /Cannot assign to read only property|frozen/i)
})

test('getPaymentOptionsLabel uses installment-plan or monthly-billing language, never monthly-subscription language', () => {
  assert.match(getPaymentOptionsLabel(getRoboticsPackage(undefined, 'builder')), /Billed monthly, averaged across your 20-class learning path\./)
  assert.match(getPaymentOptionsLabel(getRoboticsPackage(undefined, 'engineer')), /Billed monthly, averaged across your 36-class learning path\./)
  assert.match(getPaymentOptionsLabel(getRoboticsPackage(undefined, 'explorer')), /Paid in full/i)
  assert.match(getPaymentOptionsLabel(getRoboticsPackage(undefined, 'regular')), /Billed monthly for classes actually scheduled/i)
  assert.equal(getPaymentOptionsLabel(null), '')
  for (const pkg of allPackages(undefined)) {
    const label = getPaymentOptionsLabel(pkg)
    assert.doesNotMatch(label, /monthly option available/i)
    assert.doesNotMatch(label, /monthly (fee|subscription)/i)
    assert.doesNotMatch(label, /cancel.*month.to.month/i)
  }
})

test('PACKAGE_PROMO has a real deadline (not a hand-flipped flag) and carries a register-by label', () => {
  assert.equal(typeof PACKAGE_PROMO.endsAt, 'string')
  assert.ok(!Number.isNaN(new Date(PACKAGE_PROMO.endsAt).getTime()), 'endsAt must be a parseable date')
  assert.match(PACKAGE_PROMO.registerByLabel, /September 13, 2026/)
  assert.equal(PACKAGE_PROMO.active, Date.now() <= new Date(PACKAGE_PROMO.endsAt).getTime())
})

test('PACKAGE_PROMO.active turns off automatically after its deadline, without editing this file', () => {
  const before = Date
  try {
    globalThis.Date = class extends before {
      static now() {
        return new before(PACKAGE_PROMO.endsAt).getTime() + 1000
      }
    }
    assert.equal(PACKAGE_PROMO.active, false)
  } finally {
    globalThis.Date = before
  }
})

// --- resolvePackagePricing: the core business rules ---
// 1. The Back-to-School promotional price applies only to Pay in Full.
// 2. Installments are priced at the $30/class list rate, not the bulk
//    per-package rate — so they're always MORE than either pay-in-full
//    price, promo or not.
// 3. Recurring monthly is priced at the package's own per-class rate
//    (Builder $28/Engineer $26), never promo-discounted, and for Regular
//    only ever computed from a real offering's classesInMonth.

test('Builder: pay in full uses $532 (promotional) while the promotion is active', () => {
  const builder = getRoboticsPackage(undefined, 'builder')
  const pricing = resolvePackagePricing(builder, 'pay_in_full')
  if (PACKAGE_PROMO.active) {
    assert.equal(pricing.payableSubtotalCents, 53200)
    assert.equal(pricing.promotionApplied, true)
    assert.equal(pricing.promotionDiscountCents, 2800)
  } else {
    assert.equal(pricing.payableSubtotalCents, 56000)
    assert.equal(pricing.promotionApplied, false)
  }
  assert.equal(pricing.regularSubtotalCents, 56000)
})

test('Builder: installments always total $600 (20 classes x $30/class), even while the promotion is active', () => {
  const builder = getRoboticsPackage(undefined, 'builder')
  const pricing = resolvePackagePricing(builder, 'installments')
  assert.equal(pricing.payableSubtotalCents, 60000)
  assert.equal(pricing.regularSubtotalCents, 60000)
  assert.equal(pricing.promotionApplied, false)
  assert.equal(pricing.promotionDiscountCents, 0)
})

test('Engineer: pay in full uses $910 (promotional) while the promotion is active', () => {
  const engineer = getRoboticsPackage(undefined, 'engineer')
  const pricing = resolvePackagePricing(engineer, 'pay_in_full')
  if (PACKAGE_PROMO.active) {
    assert.equal(pricing.payableSubtotalCents, 91000)
    assert.equal(pricing.promotionApplied, true)
    assert.equal(pricing.promotionDiscountCents, 2600)
  } else {
    assert.equal(pricing.payableSubtotalCents, 93600)
    assert.equal(pricing.promotionApplied, false)
  }
  assert.equal(pricing.regularSubtotalCents, 93600)
})

test('Engineer: installments always total $1,080 (36 classes x $30/class), even while the promotion is active', () => {
  const engineer = getRoboticsPackage(undefined, 'engineer')
  const pricing = resolvePackagePricing(engineer, 'installments')
  assert.equal(pricing.payableSubtotalCents, 108000)
  assert.equal(pricing.regularSubtotalCents, 108000)
  assert.equal(pricing.promotionApplied, false)
})

test('Builder/Engineer: recurring_monthly totals $560/$936 (the package own per-class rate), never the promotion', () => {
  const before = Date
  try {
    for (const [id, expectedTotal] of [['builder', 56000], ['engineer', 93600]]) {
      const pkg = getRoboticsPackage(undefined, id)
      const pricing = resolvePackagePricing(pkg, 'recurring_monthly')
      assert.equal(pricing.payableSubtotalCents, expectedTotal)
      assert.equal(pricing.regularSubtotalCents, expectedTotal)
      assert.equal(pricing.promotionApplied, false)
    }
    // Still true after the promo window closes — recurring_monthly never
    // depended on it either way.
    globalThis.Date = class extends before {
      static now() {
        return new before(PACKAGE_PROMO.endsAt).getTime() + 1000
      }
    }
    assert.equal(resolvePackagePricing(getRoboticsPackage(undefined, 'builder'), 'recurring_monthly').payableSubtotalCents, 56000)
  } finally {
    globalThis.Date = before
  }
})

test('Regular: recurring_monthly requires a real classesInMonth and prices at $30/class for that month only', () => {
  const regular = getRoboticsPackage(undefined, 'regular')
  assert.equal(resolvePackagePricing(regular, 'recurring_monthly', { classesInMonth: 4 }).payableSubtotalCents, 12000)
  assert.equal(resolvePackagePricing(regular, 'recurring_monthly', { classesInMonth: 3 }).payableSubtotalCents, 9000)
  assert.equal(resolvePackagePricing(regular, 'recurring_monthly', { classesInMonth: 5 }).payableSubtotalCents, 15000)
  assert.equal(resolvePackagePricing(regular, 'recurring_monthly', { classesInMonth: 0 }).payableSubtotalCents, 0)
})

test('Regular: recurring_monthly throws rather than guessing when classesInMonth is missing or invalid', () => {
  const regular = getRoboticsPackage(undefined, 'regular')
  assert.throws(() => resolvePackagePricing(regular, 'recurring_monthly'))
  assert.throws(() => resolvePackagePricing(regular, 'recurring_monthly', {}))
  assert.throws(() => resolvePackagePricing(regular, 'recurring_monthly', { classesInMonth: -1 }))
  assert.throws(() => resolvePackagePricing(regular, 'recurring_monthly', { classesInMonth: 1.5 }))
  assert.throws(() => resolvePackagePricing(regular, 'recurring_monthly', { classesInMonth: 'four' }))
})

test('promotion expiry restores regular pay-in-full pricing for both Builder and Engineer', () => {
  const before = Date
  try {
    globalThis.Date = class extends before {
      static now() {
        return new before(PACKAGE_PROMO.endsAt).getTime() + 1000
      }
    }
    const builderPricing = resolvePackagePricing(getRoboticsPackage(undefined, 'builder'), 'pay_in_full')
    assert.equal(builderPricing.payableSubtotalCents, 56000)
    assert.equal(builderPricing.promotionApplied, false)
    assert.equal(builderPricing.promotionDiscountCents, 0)

    const engineerPricing = resolvePackagePricing(getRoboticsPackage(undefined, 'engineer'), 'pay_in_full')
    assert.equal(engineerPricing.payableSubtotalCents, 93600)
    assert.equal(engineerPricing.promotionApplied, false)

    // Installment pricing is unaffected either way — it never depended on
    // the promotion window in the first place.
    assert.equal(resolvePackagePricing(getRoboticsPackage(undefined, 'builder'), 'installments').payableSubtotalCents, 60000)
    assert.equal(resolvePackagePricing(getRoboticsPackage(undefined, 'engineer'), 'installments').payableSubtotalCents, 108000)
  } finally {
    globalThis.Date = before
  }
})

test('installments never receive the promotion, regardless of promo window', () => {
  const before = Date
  try {
    // Active promo window.
    for (const id of ['builder', 'engineer']) {
      const pricing = resolvePackagePricing(getRoboticsPackage(undefined, id), 'installments')
      assert.equal(pricing.promotionApplied, false)
      assert.equal(pricing.payableSubtotalCents, pricing.regularSubtotalCents)
    }
    // Expired promo window too — same result either way.
    globalThis.Date = class extends before {
      static now() {
        return new before(PACKAGE_PROMO.endsAt).getTime() + 1000
      }
    }
    for (const id of ['builder', 'engineer']) {
      const pricing = resolvePackagePricing(getRoboticsPackage(undefined, id), 'installments')
      assert.equal(pricing.promotionApplied, false)
      assert.equal(pricing.payableSubtotalCents, pricing.regularSubtotalCents)
    }
  } finally {
    globalThis.Date = before
  }
})

test('resolvePackagePricing returns null for an unknown package or method', () => {
  assert.equal(resolvePackagePricing(null, 'pay_in_full'), null)
  assert.equal(resolvePackagePricing(getRoboticsPackage(undefined, 'builder'), 'partial'), null)
})

// --- Pay-in-full savings (installment total minus pay-in-full price) ---

test('getPayInFullSavingsCents reflects the gap between the $30/class installment total and the pay-in-full price', () => {
  const builder = getRoboticsPackage(undefined, 'builder')
  const engineer = getRoboticsPackage(undefined, 'engineer')
  if (PACKAGE_PROMO.active) {
    assert.equal(getPayInFullSavingsCents(builder), 60000 - 53200) // $68.00
    assert.equal(getPayInFullSavingsCents(engineer), 108000 - 91000) // $170.00
  } else {
    assert.equal(getPayInFullSavingsCents(builder), 60000 - 56000) // $40.00
    assert.equal(getPayInFullSavingsCents(engineer), 108000 - 93600) // $144.00
  }
})

test('getPayInFullSavingsCents is never negative and is 0 for packages without an installment option', () => {
  assert.equal(getPayInFullSavingsCents(getRoboticsPackage(undefined, 'explorer')), 0)
  assert.equal(getPayInFullSavingsCents(getRoboticsPackage(undefined, 'regular')), 0)
  assert.equal(getPayInFullSavingsCents(null), 0)
  for (const pkg of allPackages(undefined)) {
    assert.ok(getPayInFullSavingsCents(pkg) >= 0)
  }
})

// --- Installment math (also reused, unmodified, for monthly-tuition averaging) ---

test('computeInstallmentAmountsCents: exact cent-level rounding, sum always equals the total', () => {
  // $600.00 (Builder installment total) over 3 payments -> $200.00 each
  assert.deepEqual(computeInstallmentAmountsCents(60000, 3), [20000, 20000, 20000])
  // A total that doesn't divide evenly still sums exactly.
  assert.deepEqual(computeInstallmentAmountsCents(56000, 3), [18667, 18667, 18666])
  assert.equal(18667 + 18667 + 18666, 56000)
})

test('computeInstallmentAmountsCents reproduces the plan\'s worked monthly-tuition examples for the $560 Builder total', () => {
  // 6 billing months -> ~$93.33/mo with the final cent adjustment.
  assert.deepEqual(computeInstallmentAmountsCents(56000, 6), [9333, 9333, 9333, 9333, 9333, 9335])
  assert.equal(9333 * 5 + 9335, 56000)
  // 5 billing months -> exactly $112.00/mo, no adjustment needed.
  assert.deepEqual(computeInstallmentAmountsCents(56000, 5), [11200, 11200, 11200, 11200, 11200])
})

test('Builder installment examples match the spec exactly ($600 installment total, not the $560/$532 pay-in-full prices)', () => {
  assert.deepEqual(computeInstallmentAmountsCents(60000, 2), [30000, 30000]) // 2 x $300.00
  assert.deepEqual(computeInstallmentAmountsCents(60000, 3), [20000, 20000, 20000]) // 3 x $200.00
  assert.deepEqual(computeInstallmentAmountsCents(60000, 4), [15000, 15000, 15000, 15000]) // 4 x $150.00
})

test('Engineer installment example matches the spec exactly ($1,080 installment total, not the $936/$910 pay-in-full prices)', () => {
  assert.deepEqual(computeInstallmentAmountsCents(108000, 6), [18000, 18000, 18000, 18000, 18000, 18000]) // 6 x $180.00
})

test('computeInstallmentAmountsCents sums to the exact $30/class installment total for every allowed installment count', () => {
  for (const pkg of allPackages(undefined)) {
    const counts = getAllowedInstallmentCounts(pkg)
    if (counts.length === 0) continue
    const installmentTotalCents = resolvePackagePricing(pkg, 'installments').payableSubtotalCents
    for (const count of counts) {
      const amounts = computeInstallmentAmountsCents(installmentTotalCents, count)
      assert.equal(amounts.length, count)
      assert.equal(amounts.reduce((a, b) => a + b, 0), installmentTotalCents)
      // First N-1 are the rounded-even share; only the last may differ.
      const regular = Math.round(installmentTotalCents / count)
      assert.ok(amounts.slice(0, -1).every(a => a === regular))
    }
  }
})

test('computeInstallmentAmountsCents rejects invalid inputs', () => {
  assert.throws(() => computeInstallmentAmountsCents(-1, 2))
  assert.throws(() => computeInstallmentAmountsCents(1.5, 2))
  assert.throws(() => computeInstallmentAmountsCents(1000, 0))
  assert.throws(() => computeInstallmentAmountsCents(1000, 1.5))
})

// --- Package snapshot (v5) ---

test('buildPackageSnapshot produces an immutable, v5 snapshot with explicit regular/promotional fields', () => {
  const snapshot = buildPackageSnapshot(undefined, 'builder')
  assert.deepEqual(snapshot, {
    version: 5,
    id: 'builder',
    name: 'Builder',
    classCount: 20,
    perClassCents: 2800,
    regularSubtotalCents: 56000,
    promotionalPayInFullSubtotalCents: 53200,
    currency: 'CAD',
    paymentOptions: {
      payInFullEnabled: true,
      installmentPlanEnabled: true,
      allowedInstallments: [2, 3, 4],
      recurringMonthlyEnabled: true,
    },
    promotionEligible: true,
    promotionName: PACKAGE_PROMO.label,
  })
  assert.equal(buildPackageSnapshot(undefined, 'bogus'), null)
})

test('buildPackageSnapshot for Regular has null class count/total and reflects its recurring-only payment options', () => {
  const snapshot = buildPackageSnapshot(undefined, 'regular')
  assert.deepEqual(snapshot, {
    version: 5,
    id: 'regular',
    name: 'Regular',
    classCount: null,
    perClassCents: 3000,
    regularSubtotalCents: null,
    promotionalPayInFullSubtotalCents: null,
    currency: 'CAD',
    paymentOptions: {
      payInFullEnabled: false,
      installmentPlanEnabled: false,
      allowedInstallments: [],
      recurringMonthlyEnabled: true,
    },
    promotionEligible: false,
    promotionName: null,
  })
})

test('buildPackageSnapshot omits the promotional price for a promotion-ineligible package', () => {
  const snapshot = buildPackageSnapshot(undefined, 'explorer')
  assert.equal(snapshot.promotionEligible, false)
  assert.equal(snapshot.promotionalPayInFullSubtotalCents, null)
  assert.equal(snapshot.promotionName, null)
})

test('existing version-3/4 snapshots (billingCadence / flat subtotalCents) remain valid, untouched data', () => {
  // Simulates snapshots persisted before this change. Nothing in the
  // current codebase should assume these shapes exist, and nothing should
  // rewrite/migrate them.
  const legacyV3Snapshot = {
    version: 3,
    id: 'builder',
    name: 'Builder',
    classCount: 20,
    perClassCents: 2800,
    subtotalCents: 56000,
    currency: 'CAD',
    billingCadence: 'monthly',
    promoLabel: null,
    promoDiscountCents: 0,
  }
  assert.equal(legacyV3Snapshot.billingCadence, 'monthly')
  assert.equal(legacyV3Snapshot.regularSubtotalCents, undefined)

  const legacyV4Snapshot = {
    version: 4,
    id: 'builder',
    name: 'Builder',
    classCount: 20,
    perClassCents: 2800,
    subtotalCents: 56000,
    currency: 'CAD',
    paymentOptions: { payInFullEnabled: true, installmentPlanEnabled: true, allowedInstallments: [2, 3, 4] },
    promoLabel: 'Back-to-School Offer: First Class Free',
    promoDiscountCents: 2800,
  }
  assert.equal(legacyV4Snapshot.subtotalCents, 56000)
  assert.equal(legacyV4Snapshot.regularSubtotalCents, undefined)
  assert.equal(legacyV4Snapshot.promotionalPayInFullSubtotalCents, undefined)
})

// --- Payment preference snapshot (v2 for pay_in_full/installments, v3 for recurring_monthly) ---

test('buildPaymentPreferenceSnapshot: pay-in-full normalizes to installmentCount 1 and uses the promotional price', () => {
  const snapshot = buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'pay_in_full', installmentCount: 4 })
  assert.equal(snapshot.version, 2)
  assert.equal(snapshot.method, 'pay_in_full')
  assert.equal(snapshot.installmentCount, 1)
  assert.equal(snapshot.currency, 'CAD')
  assert.equal(snapshot.regularSubtotalCents, 56000)
  if (PACKAGE_PROMO.active) {
    assert.equal(snapshot.payableSubtotalCents, 53200)
    assert.equal(snapshot.promotionApplied, true)
    assert.equal(snapshot.promotionDiscountCents, 2800)
  } else {
    assert.equal(snapshot.payableSubtotalCents, 56000)
    assert.equal(snapshot.promotionApplied, false)
  }
  assert.deepEqual(snapshot.installmentAmountsCents, [snapshot.payableSubtotalCents])
})

test('buildPaymentPreferenceSnapshot: installments always total $600 (Builder) and never receive the promotion', () => {
  for (const count of [2, 3, 4]) {
    const snapshot = buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'installments', installmentCount: count })
    assert.equal(snapshot.method, 'installments')
    assert.equal(snapshot.installmentCount, count)
    assert.equal(snapshot.regularSubtotalCents, 60000)
    assert.equal(snapshot.payableSubtotalCents, 60000)
    assert.equal(snapshot.promotionApplied, false)
    assert.equal(snapshot.promotionDiscountCents, 0)
    assert.equal(snapshot.installmentAmountsCents.length, count)
    assert.equal(snapshot.installmentAmountsCents.reduce((a, b) => a + b, 0), 60000)
  }
})

test('buildPaymentPreferenceSnapshot: every allowed installment count for Engineer totals $1,080', () => {
  for (const count of [2, 3, 4, 5, 6]) {
    const snapshot = buildPaymentPreferenceSnapshot(undefined, 'engineer', { method: 'installments', installmentCount: count })
    assert.equal(snapshot.installmentCount, count)
    assert.equal(snapshot.payableSubtotalCents, 108000)
    assert.equal(snapshot.promotionApplied, false)
    assert.equal(snapshot.installmentAmountsCents.reduce((a, b) => a + b, 0), 108000)
  }
})

test('buildPaymentPreferenceSnapshot rejects an installment count unsupported by the package', () => {
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'installments', installmentCount: 5 }), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'installments', installmentCount: 0 }), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'installments', installmentCount: 'four' }), null)
})

test('buildPaymentPreferenceSnapshot rejects installments for Explorer (pay-in-full only)', () => {
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'explorer', { method: 'installments', installmentCount: 2 }), null)
  const payInFull = buildPaymentPreferenceSnapshot(undefined, 'explorer', { method: 'pay_in_full' })
  assert.equal(payInFull.method, 'pay_in_full')
  assert.equal(payInFull.installmentCount, 1)
  assert.equal(payInFull.promotionApplied, false)
  assert.equal(payInFull.payableSubtotalCents, 30000)
})

test('buildPaymentPreferenceSnapshot rejects unknown packages and unknown methods', () => {
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'bogus', { method: 'pay_in_full' }), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'partial' }), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'builder', {}), null)
})

test('buildPaymentPreferenceSnapshot ignores any client-supplied financial fields on the input object', () => {
  const snapshot = buildPaymentPreferenceSnapshot(undefined, 'builder', {
    method: 'pay_in_full',
    // A malicious/buggy client might send these — none of them should
    // influence the resolved amounts, which come only from the server's
    // own catalogue via resolvePackagePricing.
    payableSubtotalCents: 1,
    regularSubtotalCents: 1,
    promotionApplied: false,
    promotionDiscountCents: 999999,
    installmentAmountsCents: [1, 1, 1],
  })
  assert.equal(snapshot.payableSubtotalCents, PACKAGE_PROMO.active ? 53200 : 56000)
  assert.equal(snapshot.regularSubtotalCents, 56000)

  const installmentsSnapshot = buildPaymentPreferenceSnapshot(undefined, 'builder', {
    method: 'installments',
    installmentCount: 2,
    payableSubtotalCents: 1,
    installmentAmountsCents: [1, 1],
  })
  assert.equal(installmentsSnapshot.payableSubtotalCents, 60000)
  assert.deepEqual(installmentsSnapshot.installmentAmountsCents, [30000, 30000])
})

test('buildPaymentPreferenceSnapshot: recurring_monthly for Builder/Engineer averages the $560/$936 total across a server-supplied billingMonthCount', () => {
  const builderSnapshot = buildPaymentPreferenceSnapshot(
    undefined, 'builder', { method: 'recurring_monthly' }, { billingMonthCount: 6 }
  )
  assert.equal(builderSnapshot.version, 3)
  assert.equal(builderSnapshot.method, 'recurring_monthly')
  assert.equal(builderSnapshot.billingMonthCount, 6)
  assert.equal(builderSnapshot.variesByMonth, false)
  assert.equal(builderSnapshot.payableSubtotalCents, 56000)
  assert.equal(builderSnapshot.promotionApplied, false)
  assert.deepEqual(builderSnapshot.monthlyAmountsCents, [9333, 9333, 9333, 9333, 9333, 9335])
  assert.equal(builderSnapshot.monthlyAmountsCents.reduce((a, b) => a + b, 0), 56000)

  const engineerSnapshot = buildPaymentPreferenceSnapshot(
    undefined, 'engineer', { method: 'recurring_monthly' }, { billingMonthCount: 9 }
  )
  assert.equal(engineerSnapshot.payableSubtotalCents, 93600)
  assert.equal(engineerSnapshot.monthlyAmountsCents.length, 9)
  assert.equal(engineerSnapshot.monthlyAmountsCents.reduce((a, b) => a + b, 0), 93600)
})

test('buildPaymentPreferenceSnapshot: recurring_monthly for Builder/Engineer requires a valid billingMonthCount in context', () => {
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'recurring_monthly' }), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'recurring_monthly' }, {}), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'recurring_monthly' }, { billingMonthCount: 0 }), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'recurring_monthly' }, { billingMonthCount: 'six' }), null)
})

test('buildPaymentPreferenceSnapshot: recurring_monthly for Regular prices one specific month and flags variesByMonth', () => {
  const snapshot = buildPaymentPreferenceSnapshot(
    undefined, 'regular', { method: 'recurring_monthly' }, { classesInMonth: 4, billingMonthLabel: 'October 2026' }
  )
  assert.equal(snapshot.version, 3)
  assert.equal(snapshot.method, 'recurring_monthly')
  assert.equal(snapshot.classesInMonth, 4)
  assert.equal(snapshot.billingMonthLabel, 'October 2026')
  assert.equal(snapshot.variesByMonth, true)
  assert.equal(snapshot.payableSubtotalCents, 12000)
  assert.equal(snapshot.promotionApplied, false)
})

test('buildPaymentPreferenceSnapshot: recurring_monthly for Regular requires both classesInMonth and billingMonthLabel', () => {
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'regular', { method: 'recurring_monthly' }), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'regular', { method: 'recurring_monthly' }, { classesInMonth: 4 }), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'regular', { method: 'recurring_monthly' }, { billingMonthLabel: 'October 2026' }), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'regular', { method: 'recurring_monthly' }, { classesInMonth: -1, billingMonthLabel: 'October 2026' }), null)
})

test('buildPaymentPreferenceSnapshot rejects recurring_monthly for a package that does not offer it', () => {
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'explorer', { method: 'recurring_monthly' }, { billingMonthCount: 3 }), null)
})
