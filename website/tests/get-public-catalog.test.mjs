import test from 'node:test'
import assert from 'node:assert/strict'
import {
  publicProgram,
  publicOffering,
  publicLegacySession,
} from '../netlify/functions/get-public-catalog.js'

function document(id, data, exists = true) {
  return { id, exists, data: () => data }
}

test('program projection omits unknown and internal fields', () => {
  const result = publicProgram(document('p1', {
    publicCatalogVersion: 1,
    isActive: true,
    title: 'Bricks Challenge',
    description: 'Public description',
    internalNotes: 'must never leave the server',
    stripePaymentLinkUrl: 'https://example.invalid/private',
  }))
  assert.deepEqual(result, {
    id: 'p1', title: 'Bricks Challenge', description: 'Public description',
  })
})

test('offering projection validates capacity and omits unknown fields', () => {
  const valid = publicOffering(document('o1', {
    programId: 'p1', publicCatalogVersion: 1, isPublished: true,
    status: 'Open', capacity: 10, confirmedCount: 2, heldCount: 1,
    internalNotes: 'private',
  }))
  assert.equal(valid.internalNotes, undefined)
  assert.equal(valid.source, 'programOffering')
  assert.equal(publicOffering(document('bad', {
    programId: 'p1', publicCatalogVersion: 1, isPublished: true,
    status: 'Open', capacity: 2, confirmedCount: 2, heldCount: 1,
  })), null)
})

test('legacy projection never returns child or tutor fields', () => {
  const result = publicLegacySession(document('s1', {
    programId: 'p1', legacyPublicBookingVersion: 1, status: 'Active',
    capacity: 10, confirmedCount: 0, studentName: 'Private Child',
    tutorNotes: 'Private note', title: 'Monday',
  }))
  assert.equal(result.studentName, undefined)
  assert.equal(result.tutorNotes, undefined)
  assert.equal(result.title, 'Monday')
})
