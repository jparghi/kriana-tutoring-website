import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ROBOTICS_PACKAGES,
  isValidPackageId,
  getRoboticsPackage,
  buildPackageSnapshot,
} from '../lib/robotics-packages.js'

test('every package subtotal equals classCount * perClassCents', () => {
  for (const pkg of ROBOTICS_PACKAGES) {
    assert.equal(pkg.classCount * pkg.perClassCents, pkg.subtotalCents, `${pkg.id} arithmetic mismatch`)
  }
})

test('exact catalogue values match the spec', () => {
  assert.deepEqual(
    ROBOTICS_PACKAGES.map(p => [p.id, p.classCount, p.perClassCents, p.subtotalCents, p.badge]),
    [
      ['explorer', 10, 3000, 30000, null],
      ['builder', 20, 2800, 56000, 'Most Popular'],
      ['engineer', 36, 2600, 93600, 'Best Value'],
    ]
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

test('buildPackageSnapshot produces an immutable, versioned snapshot', () => {
  const snapshot = buildPackageSnapshot('builder')
  assert.deepEqual(snapshot, {
    version: 1,
    id: 'builder',
    name: 'Builder',
    classCount: 20,
    perClassCents: 2800,
    subtotalCents: 56000,
    currency: 'CAD',
  })
  assert.equal(buildPackageSnapshot('bogus'), null)
})

test('package objects are frozen (cannot be mutated at runtime)', () => {
  const pkg = getRoboticsPackage('explorer')
  assert.throws(() => { pkg.perClassCents = 1 }, /Cannot assign to read only property|frozen/i)
})
