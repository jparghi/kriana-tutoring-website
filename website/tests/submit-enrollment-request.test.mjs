import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validatePayload,
  validateCatalogueRequest,
  RequestRejectedError,
  idempotencyDigest,
  buildRecurringMonthlyContext,
  formatSchedule,
} from '../netlify/functions/submit-enrollment-request.js'
import { getRoboticsPackage } from '../lib/robotics-packages.js'

function doc(data, exists = true) {
  return { exists, data: () => data }
}

const NOW = Date.now()
const FUTURE = new Date(NOW + 30 * 24 * 60 * 60 * 1000).toISOString()
const PAST = new Date(NOW - 30 * 24 * 60 * 60 * 1000).toISOString()

function baseRegistration(overrides = {}) {
  return {
    parentName: 'Jamie Parent',
    parentEmail: 'jamie@example.com',
    parentPhone: '6135551234',
    childName: 'Kiddo',
    childAge: 8,
    childGrade: 'Grade 3',
    medicalNotes: '',
    emergencyContact: '',
    specialRequests: '',
    consentAccepted: true,
    photoConsent: false,
    ...overrides,
  }
}

function baseRequest(overrides = {}) {
  return {
    programId: 'prog-1',
    offeringId: 'off-1',
    sessionId: '',
    clientRequestId: 'client-request-id-12345',
    requestedAction: 'enrollment',
    packageId: '',
    registration: baseRegistration(),
    ...overrides,
  }
}

function roboticsProgram(overrides = {}) {
  return {
    title: 'Bricks Challenge',
    category: 'Robotics',
    isActive: true,
    publicCatalogVersion: 1,
    partnerName: 'Young Engineers Ottawa',
    ageRange: '6-10',
    bookingModel: 'programOfferings',
    offeringModelVersion: 1,
    legacyBookingEnabled: false,
    ...overrides,
  }
}

function openOffering(overrides = {}) {
  return {
    programId: 'prog-1',
    publicCatalogVersion: 1,
    isPublished: true,
    status: 'Open',
    capacity: 10,
    confirmedCount: 0,
    heldCount: 0,
    classCount: 36,
    enrollmentOpenAt: PAST,
    enrollmentCloseAt: FUTURE,
    ...overrides,
  }
}

test('validatePayload accepts a request with no packageId (non-robotics)', () => {
  const result = validatePayload(baseRequest())
  assert.equal(result.error, undefined)
  assert.equal(result.packageId, '')
})

test('validatePayload rejects an unrecognized packageId up front', () => {
  const result = validatePayload({ ...baseRequest(), packageId: 'deluxe-9000' })
  assert.equal(result.error, 'Selected class package is not recognized.')
})

test('validatePayload accepts a recognized packageId with a valid payment preference', () => {
  const result = validatePayload({
    ...baseRequest(),
    packageId: 'builder',
    paymentPreference: { method: 'pay_in_full' },
  })
  assert.equal(result.error, undefined)
  assert.equal(result.packageId, 'builder')
})

test('valid robotics package submission passes catalogue validation', () => {
  const request = baseRequest({ packageId: 'builder' })
  const { program, session } = validateCatalogueRequest(
    request,
    doc(roboticsProgram()),
    doc(openOffering({ classCount: 36 })),
  )
  assert.equal(program.category, 'Robotics')
  assert.equal(session.classCount, 36)
})

test('missing package on a robotics submission is rejected', () => {
  const request = baseRequest({ packageId: '' })
  assert.throws(
    () => validateCatalogueRequest(request, doc(roboticsProgram()), doc(openOffering())),
    err => err instanceof RequestRejectedError && /choose a class package/.test(err.message),
  )
})

test('unknown package id is rejected at catalogue validation too (defense in depth)', () => {
  const request = { ...baseRequest(), packageId: 'not-a-real-package' }
  assert.throws(
    () => validateCatalogueRequest(request, doc(roboticsProgram()), doc(openOffering())),
    RequestRejectedError,
  )
})

test('package supplied to a non-robotics program is rejected', () => {
  const request = baseRequest({ packageId: 'explorer' })
  const nonRoboticsProgram = roboticsProgram({ category: 'Tutoring', partnerName: '' })
  assert.throws(
    () => validateCatalogueRequest(request, doc(nonRoboticsProgram), doc(openOffering())),
    err => err instanceof RequestRejectedError && /only available for Robotics/.test(err.message),
  )
})

test('package rejected for a legacy session (not a modern offering)', () => {
  const request = baseRequest({ offeringId: '', sessionId: 'legacy-session-1', packageId: 'explorer' })
  const legacyProgram = roboticsProgram({ legacyBookingEnabled: true, bookingModel: undefined, offeringModelVersion: undefined })
  const legacySession = {
    programId: 'prog-1',
    legacyPublicBookingVersion: 1,
    status: 'Active',
    capacity: 10,
    confirmedCount: 0,
    heldCount: 0,
  }
  assert.throws(
    () => validateCatalogueRequest(request, doc(legacyProgram), doc(legacySession)),
    err => err instanceof RequestRejectedError && /only available for current class schedules/.test(err.message),
  )
})

test('package rejected when the offering does not have enough classes', () => {
  const request = baseRequest({ packageId: 'engineer' }) // engineer needs 36 classes
  assert.throws(
    () => validateCatalogueRequest(request, doc(roboticsProgram()), doc(openOffering({ classCount: 10 }))),
    err => err instanceof RequestRejectedError && /not have enough classes/.test(err.message),
  )
})

test('non-robotics programs are unaffected when no package is supplied', () => {
  const request = baseRequest({ packageId: '' })
  const nonRoboticsProgram = roboticsProgram({ category: 'Tutoring', partnerName: '' })
  const { program } = validateCatalogueRequest(request, doc(nonRoboticsProgram), doc(openOffering()))
  assert.equal(program.category, 'Tutoring')
})

test('idempotency digest changes when packageId changes (prevents replay swapping the package)', () => {
  const a = idempotencyDigest(baseRequest({ packageId: 'explorer' }))
  const b = idempotencyDigest(baseRequest({ packageId: 'engineer' }))
  assert.notEqual(a, b)
})

test('idempotency digest is stable for identical requests', () => {
  const a = idempotencyDigest(baseRequest({ packageId: 'builder' }))
  const b = idempotencyDigest(baseRequest({ packageId: 'builder' }))
  assert.equal(a, b)
})

// --- Payment preference (commitment vs. payment scheduling are separate) ---

test('validatePayload requires a payment preference for a robotics enrollment request', () => {
  const result = validatePayload(baseRequest({ packageId: 'builder' }))
  assert.equal(result.error, 'Please choose a payment preference before requesting a spot.')
})

test('validatePayload accepts pay_in_full, ignoring any leftover client-supplied count', () => {
  const result = validatePayload(baseRequest({
    packageId: 'explorer',
    paymentPreference: { method: 'pay_in_full', installmentCount: 4 },
  }))
  assert.equal(result.error, undefined)
  assert.deepEqual(result.paymentPreference, { method: 'pay_in_full' })
})

// Installment plans were removed entirely — 'installments' is no longer a
// recognized method for any package, and a stale client sending it must be
// rejected rather than silently priced as something else.
test('validatePayload rejects the removed installments method for every package', () => {
  for (const packageId of ['builder', 'engineer', 'explorer', 'regular']) {
    const result = validatePayload(baseRequest({
      packageId,
      paymentPreference: { method: 'installments', installmentCount: 3 },
    }))
    assert.equal(result.error, 'Selected payment preference is not recognized.', `${packageId} must reject installments`)
  }
})

test('validatePayload rejects an unrecognized payment method', () => {
  const result = validatePayload(baseRequest({
    packageId: 'builder',
    paymentPreference: { method: 'crypto' },
  }))
  assert.equal(result.error, 'Selected payment preference is not recognized.')
})

test('validatePayload ignores client-supplied financial amounts on paymentPreference', () => {
  const result = validatePayload(baseRequest({
    packageId: 'builder',
    paymentPreference: {
      method: 'recurring_monthly',
      effectiveSubtotalCents: 1,
      installmentAmountsCents: [1, 1, 1],
    },
  }))
  assert.equal(result.error, undefined)
  assert.deepEqual(result.paymentPreference, { method: 'recurring_monthly' })
})

test('validatePayload rejects a payment preference on a waitlist request', () => {
  const result = validatePayload(baseRequest({
    requestedAction: 'waitlist',
    packageId: 'builder',
    paymentPreference: { method: 'pay_in_full' },
  }))
  assert.equal(result.error, 'Payment preference does not apply to waitlist requests.')
})

test('validatePayload allows a waitlist request with no payment preference at all', () => {
  const result = validatePayload(baseRequest({ requestedAction: 'waitlist', packageId: 'builder' }))
  assert.equal(result.error, undefined)
  assert.equal(result.paymentPreference, null)
})

test('validatePayload rejects a payment preference when no package is selected', () => {
  const result = validatePayload(baseRequest({ packageId: '', paymentPreference: { method: 'pay_in_full' } }))
  assert.equal(result.error, 'Payment preference is only available for class packages.')
})

// --- recurring_monthly (Regular's rolling billing + Builder/Engineer's averaged tuition) ---

test('validatePayload accepts recurring_monthly for Builder, Engineer, and Regular, dropping any client-supplied count', () => {
  for (const packageId of ['builder', 'engineer', 'regular']) {
    const result = validatePayload(baseRequest({
      packageId,
      paymentPreference: { method: 'recurring_monthly', billingMonthCount: 999, classesInMonth: 999 },
    }))
    assert.equal(result.error, undefined, `${packageId} should be accepted`)
    assert.deepEqual(result.paymentPreference, { method: 'recurring_monthly' })
  }
})

test('validatePayload rejects recurring_monthly for Explorer (pay-in-full only, no monthly option)', () => {
  const result = validatePayload(baseRequest({
    packageId: 'explorer',
    paymentPreference: { method: 'recurring_monthly' },
  }))
  assert.equal(result.error, 'Monthly billing is not available for the selected package.')
})

test('validateCatalogueRequest exempts Regular from the offering-classCount check (it has no fixed class count)', () => {
  const request = baseRequest({ packageId: 'regular' })
  const { session } = validateCatalogueRequest(
    request,
    doc(roboticsProgram()),
    doc(openOffering({ classCount: 0 })),
  )
  assert.equal(session.classCount, 0)
})

test('buildRecurringMonthlyContext for Builder/Engineer returns a real billingMonthCount from the offering schedule', () => {
  const builder = getRoboticsPackage(undefined, 'builder')
  const session = openOffering({ firstClassDate: '2026-09-14', weekday: 'Monday', timezone: 'America/Toronto' })
  const context = buildRecurringMonthlyContext(builder, session)
  assert.equal(context.billingMonthCount, 6) // matches the hand-traced fixture in robotics-monthly-tuition.test.mjs
})

test('buildRecurringMonthlyContext for Regular returns classesInMonth/billingMonthLabel from the offering schedule', () => {
  const regular = getRoboticsPackage(undefined, 'regular')
  const session = openOffering({ firstClassDate: '2026-09-14', weekday: 'Monday', timezone: 'America/Toronto' })
  const context = buildRecurringMonthlyContext(regular, session)
  assert.equal(context.classesInMonth, 3) // Sep 14, 21, 28
  assert.equal(context.billingMonthLabel, 'September 2026')
})

test('buildRecurringMonthlyContext returns null when the offering has no computable schedule, so the caller rejects rather than guessing', () => {
  const builder = getRoboticsPackage(undefined, 'builder')
  assert.equal(buildRecurringMonthlyContext(builder, openOffering({ firstClassDate: undefined, weekday: undefined })), null)
  assert.equal(buildRecurringMonthlyContext(null, openOffering()), null)
})

// --- formatSchedule (confirmation email copy) ---

test('formatSchedule does not crash for a modern weekday/startTime offering with a string firstClassDate (regression: toDateValue returns a string, not a Date)', () => {
  const session = openOffering({
    title: 'Fall 2026 - Monday Batch 1',
    weekday: 'Monday',
    startTime: '16:15',
    endTime: '17:15',
    firstClassDate: '2026-09-14T20:15:00.000Z',
    timezone: 'America/Toronto',
  })
  const label = formatSchedule(session)
  assert.match(label, /Fall 2026 - Monday Batch 1/)
  assert.match(label, /Monday, September 14, 2026/)
})

test('formatSchedule falls back to a generic weekday label when firstClassDate is missing', () => {
  const session = openOffering({ weekday: 'Monday', startTime: '16:15', endTime: '17:15', firstClassDate: undefined })
  assert.match(formatSchedule(session), /^Mondays at /)
})
