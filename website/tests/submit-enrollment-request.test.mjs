import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validatePayload,
  validateCatalogueRequest,
  RequestRejectedError,
  idempotencyDigest,
} from '../netlify/functions/submit-enrollment-request.js'

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

test('validatePayload normalizes pay_in_full to installmentCount 1, ignoring any client-supplied count', () => {
  const result = validatePayload(baseRequest({
    packageId: 'builder',
    paymentPreference: { method: 'pay_in_full', installmentCount: 4 },
  }))
  assert.equal(result.error, undefined)
  assert.deepEqual(result.paymentPreference, { method: 'pay_in_full', installmentCount: 1 })
})

test('validatePayload accepts every allowed installment count for Builder', () => {
  for (const count of [2, 3, 4]) {
    const result = validatePayload(baseRequest({
      packageId: 'builder',
      paymentPreference: { method: 'installments', installmentCount: count },
    }))
    assert.equal(result.error, undefined, `count ${count} should be accepted`)
    assert.deepEqual(result.paymentPreference, { method: 'installments', installmentCount: count })
  }
})

test('validatePayload accepts every allowed installment count for Engineer', () => {
  for (const count of [2, 3, 4, 5, 6]) {
    const result = validatePayload(baseRequest({
      packageId: 'engineer',
      paymentPreference: { method: 'installments', installmentCount: count },
    }))
    assert.equal(result.error, undefined, `count ${count} should be accepted`)
    assert.deepEqual(result.paymentPreference, { method: 'installments', installmentCount: count })
  }
})

test('validatePayload rejects an installment count unsupported by the selected package', () => {
  const result = validatePayload(baseRequest({
    packageId: 'builder',
    paymentPreference: { method: 'installments', installmentCount: 5 },
  }))
  assert.equal(result.error, 'Selected installment plan is not available for this package.')
})

test('validatePayload rejects installments for Explorer (pay-in-full only)', () => {
  const result = validatePayload(baseRequest({
    packageId: 'explorer',
    paymentPreference: { method: 'installments', installmentCount: 2 },
  }))
  assert.equal(result.error, 'Selected installment plan is not available for this package.')
})

test('validatePayload rejects an unrecognized payment method', () => {
  const result = validatePayload(baseRequest({
    packageId: 'builder',
    paymentPreference: { method: 'crypto', installmentCount: 2 },
  }))
  assert.equal(result.error, 'Selected payment preference is not recognized.')
})

test('validatePayload ignores client-supplied financial amounts on paymentPreference', () => {
  const result = validatePayload(baseRequest({
    packageId: 'builder',
    paymentPreference: {
      method: 'installments',
      installmentCount: 3,
      effectiveSubtotalCents: 1,
      installmentAmountsCents: [1, 1, 1],
    },
  }))
  assert.equal(result.error, undefined)
  assert.deepEqual(result.paymentPreference, { method: 'installments', installmentCount: 3 })
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
