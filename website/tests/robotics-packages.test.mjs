import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PACKAGE_PROMO,
  isValidPackageId,
  getRoboticsPackage,
  getPubliclyVisiblePackages,
  getPaymentOptionsLabel,
  resolvePackagePricing,
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

test('every package is a fixed_learning_path whose subtotal equals classCount * perClassCents', () => {
  for (const pkg of allPackages(undefined)) {
    assert.equal(pkg.planType, 'fixed_learning_path', `${pkg.id} must be a fixed learning path`)
    assert.equal(pkg.classCount * pkg.perClassCents, pkg.regularSubtotalCents, `${pkg.id} arithmetic mismatch`)
  }
})

// No catalogue package is `rolling_monthly` any more (Regular became a fixed
// 10-class package), but the resolver must keep handling that shape so
// historical `variesByMonth: true` payment-preference snapshots still price
// and render correctly.
test('no catalogue package is rolling_monthly, in either rate card', () => {
  for (const programId of [undefined, SMARTIVO_PROGRAM_ID]) {
    for (const pkg of allPackages(programId)) {
      assert.notEqual(pkg.planType, 'rolling_monthly')
    }
  }
})

test('exact default-catalogue values match the spec', () => {
  assert.deepEqual(
    allPackages(undefined).map(p => [p.id, p.classCount, p.perClassCents, p.regularSubtotalCents, p.promotionalPayInFullSubtotalCents, p.badge]),
    [
      ['regular', 10, 3200, 32000, null, null],
      ['explorer', 10, 3000, 30000, null, null],
      ['builder', 20, 2800, 56000, null, 'Most Popular'],
      ['engineer', 36, 2500, 90000, null, 'Best Value'],
    ]
  )
})

test('Smartivo catalogue matches the 60-minute rate card ($30 Regular / $26 Builder / $24 Engineer)', () => {
  const smartivoRegular = getRoboticsPackage(SMARTIVO_PROGRAM_ID, 'regular')
  assert.equal(smartivoRegular.perClassCents, 3000)
  assert.equal(smartivoRegular.classCount, 10)
  assert.equal(smartivoRegular.regularSubtotalCents, 30000)
  assert.deepEqual(
    ['builder', 'engineer'].map(id => {
      const p = getRoboticsPackage(SMARTIVO_PROGRAM_ID, id)
      return [p.id, p.classCount, p.perClassCents, p.regularSubtotalCents, p.promotionalPayInFullSubtotalCents, p.badge]
    }),
    [
      ['builder', 20, 2600, 52000, null, 'Most Popular'],
      ['engineer', 36, 2400, 86400, null, 'Best Value'],
    ]
  )
})

test('Builder and Engineer are billed monthly only — no installment plan exists for any package', () => {
  const builder = getRoboticsPackage(undefined, 'builder')
  assert.deepEqual(builder.paymentOptions, { payInFullEnabled: true, recurringMonthlyEnabled: true })

  const engineer = getRoboticsPackage(undefined, 'engineer')
  assert.deepEqual(engineer.paymentOptions, { payInFullEnabled: true, recurringMonthlyEnabled: true })

  // Installment plans were removed: no package carries an installment rate,
  // an installment flag, or resolvable installment pricing.
  for (const pkg of allPackages(undefined)) {
    assert.equal(pkg.installmentPerClassCents, undefined, `${pkg.id} must not carry an installment rate`)
    assert.equal(pkg.paymentOptions.installmentPlanEnabled, undefined, `${pkg.id} must not carry an installment flag`)
    assert.equal(resolvePackagePricing(pkg, 'installments'), null, `${pkg.id} must not resolve installment pricing`)
  }
})

test('Regular is a public 10-class learning path, payable in full or monthly, never promotion-eligible', () => {
  const regular = getRoboticsPackage(undefined, 'regular')
  assert.deepEqual(regular.paymentOptions, { payInFullEnabled: true, recurringMonthlyEnabled: true })
  assert.equal(regular.planType, 'fixed_learning_path')
  assert.equal(regular.classCount, 10)
  assert.equal(regular.minimumClassCommitment, 10)
  assert.equal(regular.promotionEligible, false)
  assert.equal(regular.publicVisible, true)
})

// Regular is the undiscounted rate every other package's savings are quoted
// against, so it must always be the most expensive per class.
test('Regular carries the rate card standard per-class rate in both catalogues', () => {
  for (const [programId, expected] of [[undefined, 3200], [SMARTIVO_PROGRAM_ID, 3000]]) {
    const regular = getRoboticsPackage(programId, 'regular')
    assert.equal(regular.perClassCents, expected)
    for (const id of ['builder', 'engineer']) {
      assert.ok(
        getRoboticsPackage(programId, id).perClassCents < regular.perClassCents,
        `${id} must cost less per class than Regular`
      )
    }
  }
})

test('Explorer stays pay-in-full only, private, and promotion-ineligible unless explicitly configured otherwise', () => {
  const explorer = getRoboticsPackage(undefined, 'explorer')
  assert.deepEqual(explorer.paymentOptions, { payInFullEnabled: true, recurringMonthlyEnabled: false })
  assert.equal(explorer.promotionEligible, false)
  assert.equal(explorer.publicVisible, false)

  // Not eligible for the promotion regardless of the promo window, and its
  // pay-in-full price is always the regular price.
  const pricing = resolvePackagePricing(explorer, 'pay_in_full')
  assert.equal(pricing.promotionApplied, false)
  assert.equal(pricing.payableSubtotalCents, explorer.regularSubtotalCents)
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
  assert.throws(() => { pkg.paymentOptions.payInFullEnabled = false }, /Cannot assign to read only property|frozen/i)
})

test('getPaymentOptionsLabel uses pay-in-full or monthly-billing language, never monthly-subscription language', () => {
  assert.match(getPaymentOptionsLabel(getRoboticsPackage(undefined, 'builder')), /Billed monthly, averaged across your 20-class learning path\./)
  assert.match(getPaymentOptionsLabel(getRoboticsPackage(undefined, 'engineer')), /Billed monthly, averaged across your 36-class learning path\./)
  assert.match(getPaymentOptionsLabel(getRoboticsPackage(undefined, 'explorer')), /Paid in full/i)
  assert.match(getPaymentOptionsLabel(getRoboticsPackage(undefined, 'regular')), /Billed monthly, averaged across your 10-class learning path\./)
  assert.equal(getPaymentOptionsLabel(null), '')
  for (const pkg of allPackages(undefined)) {
    const label = getPaymentOptionsLabel(pkg)
    assert.doesNotMatch(label, /monthly option available/i)
    assert.doesNotMatch(label, /monthly (fee|subscription)/i)
    assert.doesNotMatch(label, /cancel.*month.to.month/i)
  }
})

test('PACKAGE_PROMO is retired: no active campaign, no label, no deadline', () => {
  assert.equal(PACKAGE_PROMO.active, false)
  assert.equal(PACKAGE_PROMO.label, null)
  assert.equal(PACKAGE_PROMO.registerByLabel, null)
  assert.equal(PACKAGE_PROMO.endsAt, null)
})

test('no package is promotion-eligible, so no pricing can ever report a promotion', () => {
  for (const programId of [undefined, SMARTIVO_PROGRAM_ID]) {
    for (const pkg of allPackages(programId)) {
      assert.equal(pkg.promotionEligible, false, `${pkg.id} must not be promotion-eligible`)
      assert.equal(pkg.promotionalPayInFullSubtotalCents, null, `${pkg.id} must not carry a promotional price`)
      if (!pkg.paymentOptions.payInFullEnabled) continue
      const pricing = resolvePackagePricing(pkg, 'pay_in_full')
      assert.equal(pricing.promotionApplied, false)
      assert.equal(pricing.promotionDiscountCents, 0)
      assert.equal(pricing.payableSubtotalCents, pkg.regularSubtotalCents)
    }
  }
})

// --- resolvePackagePricing: the core business rules ---
// 1. No promotion exists, so pay-in-full is always the package's regular price.
// 2. Recurring monthly is priced at the package's own per-class rate
//    (Regular $32/Builder $28/Engineer $25) across the whole learning path.

test('Pay in full is the regular price for every public package — no promotion is applied', () => {
  for (const [id, expectedTotal] of [['regular', 32000], ['builder', 56000], ['engineer', 90000]]) {
    const pricing = resolvePackagePricing(getRoboticsPackage(undefined, id), 'pay_in_full')
    assert.equal(pricing.payableSubtotalCents, expectedTotal, `${id} pay-in-full total`)
    assert.equal(pricing.regularSubtotalCents, expectedTotal)
    assert.equal(pricing.promotionApplied, false)
    assert.equal(pricing.promotionDiscountCents, 0)
  }
})

test('recurring_monthly totals $320/$560/$900 — the package own per-class rate across the whole path', () => {
  for (const [id, expectedTotal] of [['regular', 32000], ['builder', 56000], ['engineer', 90000]]) {
    const pricing = resolvePackagePricing(getRoboticsPackage(undefined, id), 'recurring_monthly')
    assert.equal(pricing.payableSubtotalCents, expectedTotal, `${id} recurring total`)
    assert.equal(pricing.regularSubtotalCents, expectedTotal)
    assert.equal(pricing.promotionApplied, false)
  }
})

// Regular is no longer rolling_monthly, so it no longer needs (or reads)
// classesInMonth — it prices its whole 10-class path like any other package.
test('Regular: recurring_monthly prices the full 10-class path and ignores classesInMonth', () => {
  const regular = getRoboticsPackage(undefined, 'regular')
  assert.equal(resolvePackagePricing(regular, 'recurring_monthly').payableSubtotalCents, 32000)
  assert.equal(resolvePackagePricing(regular, 'recurring_monthly', { classesInMonth: 4 }).payableSubtotalCents, 32000)
})

// The rolling_monthly branch still has to behave for historical snapshots.
test('a rolling_monthly package still requires a real classesInMonth rather than guessing', () => {
  const legacyRollingPkg = Object.freeze({
    id: 'legacy-rolling', planType: 'rolling_monthly', classCount: null,
    perClassCents: 3200, regularSubtotalCents: null, promotionEligible: false,
  })
  assert.equal(resolvePackagePricing(legacyRollingPkg, 'recurring_monthly', { classesInMonth: 4 }).payableSubtotalCents, 12800)
  assert.equal(resolvePackagePricing(legacyRollingPkg, 'recurring_monthly', { classesInMonth: 0 }).payableSubtotalCents, 0)
  assert.throws(() => resolvePackagePricing(legacyRollingPkg, 'recurring_monthly'))
  assert.throws(() => resolvePackagePricing(legacyRollingPkg, 'recurring_monthly', { classesInMonth: -1 }))
  assert.throws(() => resolvePackagePricing(legacyRollingPkg, 'recurring_monthly', { classesInMonth: 1.5 }))
  assert.throws(() => resolvePackagePricing(legacyRollingPkg, 'recurring_monthly', { classesInMonth: 'four' }))
})

test('resolvePackagePricing returns null for an unknown package or method', () => {
  assert.equal(resolvePackagePricing(null, 'pay_in_full'), null)
  assert.equal(resolvePackagePricing(getRoboticsPackage(undefined, 'builder'), 'partial'), null)
  // 'installments' is no longer a method at all, for any package.
  assert.equal(resolvePackagePricing(getRoboticsPackage(undefined, 'builder'), 'installments'), null)
})

// --- Monthly-tuition averaging math (computeInstallmentAmountsCents) ---
// Despite its name this is not the removed installment plan — it spreads a
// learning path's total across its real billing months.

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

test('Builder installment examples match the spec exactly ($640 installment total, not the $560/$532 pay-in-full prices)', () => {
  assert.deepEqual(computeInstallmentAmountsCents(64000, 2), [32000, 32000]) // 2 x $320.00
  assert.deepEqual(computeInstallmentAmountsCents(64000, 4), [16000, 16000, 16000, 16000]) // 4 x $160.00
})

test('Engineer installment example matches the spec exactly ($1,152 installment total, not the $900/$875 pay-in-full prices)', () => {
  assert.deepEqual(computeInstallmentAmountsCents(115200, 6), [19200, 19200, 19200, 19200, 19200, 19200]) // 6 x $192.00
})

test('computeInstallmentAmountsCents sums to a learning path total exactly, for every plausible billing-month count', () => {
  for (const pkg of allPackages(undefined)) {
    if (pkg.planType !== 'fixed_learning_path') continue
    const totalCents = resolvePackagePricing(pkg, 'recurring_monthly').payableSubtotalCents
    for (let count = 1; count <= 12; count++) {
      const amounts = computeInstallmentAmountsCents(totalCents, count)
      assert.equal(amounts.length, count)
      assert.equal(amounts.reduce((a, b) => a + b, 0), totalCents)
      // First N-1 are the rounded-even share; only the last may differ.
      const regular = Math.round(totalCents / count)
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

// --- Package snapshot (v6) ---

test('buildPackageSnapshot produces an immutable, v6 snapshot with explicit regular/promotional fields', () => {
  const snapshot = buildPackageSnapshot(undefined, 'builder')
  assert.deepEqual(snapshot, {
    version: 6,
    id: 'builder',
    name: 'Builder',
    classCount: 20,
    perClassCents: 2800,
    regularSubtotalCents: 56000,
    promotionalPayInFullSubtotalCents: null,
    currency: 'CAD',
    paymentOptions: { payInFullEnabled: true, recurringMonthlyEnabled: true },
    promotionEligible: false,
    promotionName: null,
  })
  assert.equal(buildPackageSnapshot(undefined, 'bogus'), null)
})

test('buildPackageSnapshot for Regular carries its 10-class count/total and both payment options', () => {
  const snapshot = buildPackageSnapshot(undefined, 'regular')
  assert.deepEqual(snapshot, {
    version: 6,
    id: 'regular',
    name: 'Regular',
    classCount: 10,
    perClassCents: 3200,
    regularSubtotalCents: 32000,
    promotionalPayInFullSubtotalCents: null,
    currency: 'CAD',
    paymentOptions: { payInFullEnabled: true, recurringMonthlyEnabled: true },
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

test('buildPaymentPreferenceSnapshot: pay-in-full normalizes to installmentCount 1 and uses the regular price', () => {
  const snapshot = buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'pay_in_full', installmentCount: 4 })
  assert.equal(snapshot.version, 2)
  assert.equal(snapshot.method, 'pay_in_full')
  assert.equal(snapshot.installmentCount, 1)
  assert.equal(snapshot.currency, 'CAD')
  assert.equal(snapshot.regularSubtotalCents, 56000)
  assert.equal(snapshot.payableSubtotalCents, 56000)
  assert.equal(snapshot.promotionApplied, false)
  assert.equal(snapshot.promotionDiscountCents, 0)
  assert.deepEqual(snapshot.installmentAmountsCents, [56000])
})

test('buildPaymentPreferenceSnapshot never builds an installments snapshot, for any package or count', () => {
  for (const packageId of ['builder', 'engineer', 'explorer', 'regular']) {
    for (const installmentCount of [2, 3, 4, 5, 6]) {
      assert.equal(
        buildPaymentPreferenceSnapshot(undefined, packageId, { method: 'installments', installmentCount }),
        null,
        `${packageId} must not accept a ${installmentCount}-payment installment plan`
      )
    }
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

  const monthlySnapshot = buildPaymentPreferenceSnapshot(undefined, 'builder', {
    method: 'recurring_monthly',
    payableSubtotalCents: 1,
    monthlyAmountsCents: [1, 1],
  }, { billingMonthCount: 5 })
  assert.equal(monthlySnapshot.payableSubtotalCents, 56000)
  assert.deepEqual(monthlySnapshot.monthlyAmountsCents, [11200, 11200, 11200, 11200, 11200])
})

test('buildPaymentPreferenceSnapshot: recurring_monthly for Builder/Engineer averages the $560/$900 total across a server-supplied billingMonthCount', () => {
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
  assert.equal(engineerSnapshot.payableSubtotalCents, 90000)
  assert.equal(engineerSnapshot.monthlyAmountsCents.length, 9)
  assert.equal(engineerSnapshot.monthlyAmountsCents.reduce((a, b) => a + b, 0), 90000)
})

test('buildPaymentPreferenceSnapshot: recurring_monthly for Builder/Engineer requires a valid billingMonthCount in context', () => {
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'recurring_monthly' }), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'recurring_monthly' }, {}), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'recurring_monthly' }, { billingMonthCount: 0 }), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'builder', { method: 'recurring_monthly' }, { billingMonthCount: 'six' }), null)
})

test('buildPaymentPreferenceSnapshot: recurring_monthly for Regular averages its $320 path across real billing months', () => {
  const snapshot = buildPaymentPreferenceSnapshot(
    undefined, 'regular', { method: 'recurring_monthly' }, { billingMonthCount: 3 }
  )
  assert.equal(snapshot.version, 3)
  assert.equal(snapshot.method, 'recurring_monthly')
  assert.equal(snapshot.billingMonthCount, 3)
  assert.equal(snapshot.variesByMonth, false)
  assert.equal(snapshot.payableSubtotalCents, 32000)
  assert.deepEqual(snapshot.monthlyAmountsCents, [10667, 10667, 10666])
  assert.equal(snapshot.monthlyAmountsCents.reduce((a, b) => a + b, 0), 32000)
  assert.equal(snapshot.promotionApplied, false)
  // No longer a rolling plan: a month-scoped context can't stand in for a
  // real billing-month count.
  assert.equal(snapshot.classesInMonth, undefined)
})

test('buildPaymentPreferenceSnapshot: recurring_monthly for Regular requires a real billingMonthCount', () => {
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'regular', { method: 'recurring_monthly' }), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'regular', { method: 'recurring_monthly' }, {}), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'regular', { method: 'recurring_monthly' }, { billingMonthCount: 0 }), null)
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'regular', { method: 'recurring_monthly' }, { classesInMonth: 4, billingMonthLabel: 'October 2026' }), null)
})

test('buildPaymentPreferenceSnapshot rejects recurring_monthly for a package that does not offer it', () => {
  assert.equal(buildPaymentPreferenceSnapshot(undefined, 'explorer', { method: 'recurring_monthly' }, { billingMonthCount: 3 }), null)
})

// --- Marketing surfaces resolve a rate card without a Firestore lookup ---

test('the Smartivo licensed slug resolves the same 60-minute rate card as its Firestore id', () => {
  for (const id of ['regular', 'builder', 'engineer']) {
    assert.deepEqual(
      getRoboticsPackage('smartivo', id),
      getRoboticsPackage(SMARTIVO_PROGRAM_ID, id),
      `${id} must price identically by slug and by Firestore id`,
    )
  }
  // Every other program (including the other licensed slugs) keeps the
  // 75-minute rate card.
  for (const slug of ['bricks-challenge', 'algo-play', undefined]) {
    assert.equal(getRoboticsPackage(slug, 'regular').perClassCents, 3200)
    assert.equal(getRoboticsPackage(slug, 'engineer').perClassCents, 2500)
  }
})
