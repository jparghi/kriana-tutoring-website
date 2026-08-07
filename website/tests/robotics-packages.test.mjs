import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ROBOTICS_PACKAGES,
  PACKAGE_PROMO,
  isValidPackageId,
  getRoboticsPackage,
  getPubliclyVisiblePackages,
  getPackagePromoDiscountCents,
  getDiscountedSubtotalCents,
  getBillingCadenceLabel,
  buildPackageSnapshot,
} from '../lib/robotics-packages.js'

test('every package subtotal equals classCount * perClassCents', () => {
  for (const pkg of ROBOTICS_PACKAGES) {
    assert.equal(pkg.classCount * pkg.perClassCents, pkg.subtotalCents, `${pkg.id} arithmetic mismatch`)
  }
})

test('exact catalogue values match the spec', () => {
  assert.deepEqual(
    ROBOTICS_PACKAGES.map(p => [p.id, p.classCount, p.perClassCents, p.subtotalCents, p.badge, p.billingCadence]),
    [
      ['explorer', 10, 3000, 30000, null, 'upfront'],
      ['builder', 20, 2800, 56000, null, 'monthly'],
      ['engineer', 36, 2600, 93600, 'Best Value', 'monthly'],
    ]
  )
})

test('Explorer is enabled system-wide but excluded from the public package grid', () => {
  assert.equal(isValidPackageId('explorer'), true)
  assert.ok(getRoboticsPackage('explorer'), 'Explorer must still resolve by id for direct/shared links, registration, and checkout')
  assert.equal(
    getPubliclyVisiblePackages().some(p => p.id === 'explorer'),
    false,
    'Explorer must not appear in the public package grid'
  )
  assert.deepEqual(
    getPubliclyVisiblePackages().map(p => p.id),
    ['builder', 'engineer'],
  )
})

test('isValidPackageId only accepts known ids', () => {
  assert.equal(isValidPackageId('explorer'), true)
  assert.equal(isValidPackageId('builder'), true)
  assert.equal(isValidPackageId('engineer'), true)
  assert.equal(isValidPackageId('bogus'), false)
  assert.equal(isValidPackageId(''), false)
  assert.equal(isValidPackageId(undefined), false)
  assert.equal(isValidPackageId(null), false)
  assert.equal(isValidPackageId({ id: 'builder' }), false)
})

test('getRoboticsPackage returns null for unknown ids', () => {
  assert.equal(getRoboticsPackage('bogus'), null)
  assert.equal(getRoboticsPackage('builder')?.name, 'Builder')
})

test('buildPackageSnapshot produces an immutable, versioned snapshot including the active promo', () => {
  const snapshot = buildPackageSnapshot('builder')
  assert.deepEqual(snapshot, {
    version: 3,
    id: 'builder',
    name: 'Builder',
    classCount: 20,
    perClassCents: 2800,
    subtotalCents: 56000,
    currency: 'CAD',
    billingCadence: 'monthly',
    promoLabel: PACKAGE_PROMO.active ? PACKAGE_PROMO.label : null,
    promoDiscountCents: PACKAGE_PROMO.active ? 2800 : 0,
  })
  assert.equal(buildPackageSnapshot('bogus'), null)
})

test('package objects are frozen (cannot be mutated at runtime)', () => {
  const pkg = getRoboticsPackage('explorer')
  assert.throws(() => { pkg.perClassCents = 1 }, /Cannot assign to read only property|frozen/i)
})

test('getPackagePromoDiscountCents equals one class at the package rate when the promo is active', () => {
  for (const pkg of ROBOTICS_PACKAGES) {
    const expected = PACKAGE_PROMO.active ? pkg.perClassCents * PACKAGE_PROMO.discountClasses : 0
    assert.equal(getPackagePromoDiscountCents(pkg), expected, `${pkg.id} promo discount mismatch`)
  }
  assert.equal(getPackagePromoDiscountCents(null), 0)
})

test('getDiscountedSubtotalCents subtracts the promo discount and never goes negative', () => {
  const pkg = getRoboticsPackage('explorer')
  const expected = Math.max(0, pkg.subtotalCents - getPackagePromoDiscountCents(pkg))
  assert.equal(getDiscountedSubtotalCents(pkg), expected)
  assert.equal(getDiscountedSubtotalCents(null), 0)
})

test('getBillingCadenceLabel explains upfront vs monthly billing per package', () => {
  assert.match(getBillingCadenceLabel(getRoboticsPackage('explorer')), /upfront/i)
  assert.match(getBillingCadenceLabel(getRoboticsPackage('builder')), /monthly/i)
  assert.match(getBillingCadenceLabel(getRoboticsPackage('engineer')), /monthly/i)
  assert.equal(getBillingCadenceLabel(null), '')
})

test('PACKAGE_PROMO has a real deadline (not a hand-flipped flag) and carries a register-by label', () => {
  assert.equal(typeof PACKAGE_PROMO.endsAt, 'string')
  assert.ok(!Number.isNaN(new Date(PACKAGE_PROMO.endsAt).getTime()), 'endsAt must be a parseable date')
  assert.match(PACKAGE_PROMO.registerByLabel, /September 13, 2026/)
  // `active` is derived from `endsAt` vs. the real current time, not a
  // static boolean — this assertion is only meaningful before the deadline,
  // which is fine since it documents the intended pre-deadline state.
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
