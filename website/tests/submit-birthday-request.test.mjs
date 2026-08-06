import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validatePayload,
  validateProgram,
  requiresCapacityReview,
  priceSnapshot,
  idempotencyDigest,
} from '../netlify/functions/submit-birthday-request.js'
import { RequestRejectedError } from '../netlify/functions/submit-enrollment-request.js'

function doc(data, exists = true) {
  return { exists, data: () => data }
}

function futureDate(daysAhead) {
  const d = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

function baseBody(overrides = {}) {
  return {
    programId: 'birthday-prog-1',
    clientRequestId: 'client-request-id-12345',
    parentName: 'Jamie Parent',
    parentEmail: 'jamie@example.com',
    parentPhone: '6135551234',
    childName: 'Kiddo',
    childAge: 8,
    preferredDate: futureDate(14),
    preferredStartTime: '14:00',
    alternateDate: '',
    alternateStartTime: '',
    partyLocation: '123 Main St, Kanata',
    expectedChildCount: 8,
    notes: '',
    accessibilityNotes: '',
    consentAccepted: true,
    website: '',
    ...overrides,
  }
}

function birthdayProgram(overrides = {}) {
  return {
    title: 'Young Engineers Robotics Birthday Experience',
    category: 'Birthday Party',
    partnerName: 'Young Engineers',
    isActive: true,
    publicCatalogVersion: 1,
    price: 24900,
    discountActive: true,
    discountLabel: 'Limited-Time Launch Offer',
    discountType: 'amount',
    discountValue: 3000,
    currency: 'CAD',
    ...overrides,
  }
}

test('validatePayload accepts a well-formed request', () => {
  const result = validatePayload(baseBody())
  assert.equal(result.error, undefined)
  assert.equal(result.programId, 'birthday-prog-1')
  assert.equal(result.request.expectedChildCount, 8)
})

test('validatePayload rejects a past preferred date', () => {
  const result = validatePayload(baseBody({ preferredDate: '2000-01-01' }))
  assert.match(result.error, /past/i)
})

test('validatePayload rejects an invalid email', () => {
  const result = validatePayload(baseBody({ parentEmail: 'not-an-email' }))
  assert.match(result.error, /email/i)
})

test('validatePayload rejects a non-integer child age', () => {
  const result = validatePayload(baseBody({ childAge: 0 }))
  assert.match(result.error, /age/i)
})

test('validatePayload rejects missing consent', () => {
  const result = validatePayload(baseBody({ consentAccepted: false }))
  assert.match(result.error, /consent|availability request/i)
})

test('validatePayload accepts more than 8 expected children (flagged, not rejected)', () => {
  const result = validatePayload(baseBody({ expectedChildCount: 15 }))
  assert.equal(result.error, undefined)
  assert.equal(result.request.expectedChildCount, 15)
})

test('validatePayload rejects a non-positive expected child count', () => {
  const result = validatePayload(baseBody({ expectedChildCount: 0 }))
  assert.match(result.error, /number of participating children/i)
})

test('validatePayload silently flags a triggered honeypot', () => {
  const result = validatePayload(baseBody({ website: 'http://spam.example' }))
  assert.equal(result.honeypotTriggered, true)
  assert.equal(result.error, undefined)
})

test('requiresCapacityReview flags groups over 8, not exactly 8', () => {
  assert.equal(requiresCapacityReview(8), false)
  assert.equal(requiresCapacityReview(9), true)
})

test('priceSnapshot never trusts client input — always derives from the program record', () => {
  const snapshot = priceSnapshot(birthdayProgram())
  assert.equal(snapshot.regularPriceCentsSnapshot, 24900)
  assert.equal(snapshot.launchPriceCentsSnapshot, 21900)
  assert.equal(snapshot.promotionLabelSnapshot, 'Limited-Time Launch Offer')
  assert.equal(snapshot.currency, 'CAD')
})

test('priceSnapshot reflects an inactive promotion as full price', () => {
  const snapshot = priceSnapshot(birthdayProgram({ discountActive: false }))
  assert.equal(snapshot.launchPriceCentsSnapshot, 24900)
  assert.equal(snapshot.promotionLabelSnapshot, '')
})

test('validateProgram accepts an active, public Birthday Party program', () => {
  const program = validateProgram(doc(birthdayProgram()))
  assert.equal(program.category, 'Birthday Party')
})

test('validateProgram rejects an inactive program', () => {
  assert.throws(
    () => validateProgram(doc(birthdayProgram({ isActive: false }))),
    RequestRejectedError,
  )
})

test('validateProgram rejects a program outside the public catalog', () => {
  assert.throws(
    () => validateProgram(doc(birthdayProgram({ publicCatalogVersion: 0 }))),
    RequestRejectedError,
  )
})

test('validateProgram rejects a program with the wrong category', () => {
  assert.throws(
    () => validateProgram(doc(birthdayProgram({ category: 'Robotics' }))),
    RequestRejectedError,
  )
})

test('validateProgram rejects a missing program', () => {
  assert.throws(
    () => validateProgram(doc(null, false)),
    RequestRejectedError,
  )
})

test('idempotencyDigest is stable for identical inputs and differs when the preferred date changes', () => {
  const request = validatePayload(baseBody()).request
  const digestA = idempotencyDigest('birthday-prog-1', request, 'client-request-id-12345')
  const digestB = idempotencyDigest('birthday-prog-1', request, 'client-request-id-12345')
  assert.equal(digestA, digestB)

  const otherRequest = { ...request, preferredDate: futureDate(30) }
  const digestC = idempotencyDigest('birthday-prog-1', otherRequest, 'client-request-id-12345')
  assert.notEqual(digestA, digestC)
})
