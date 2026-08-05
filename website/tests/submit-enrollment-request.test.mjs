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

test('validatePayload accepts a recognized packageId', () => {
  const result = validatePayload({ ...baseRequest(), packageId: 'builder' })
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
