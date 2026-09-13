import test from 'node:test'
import assert from 'node:assert/strict'

process.env.DEMO_ELIGIBILITY_KEY_SALT = 'test-demo-eligibility-salt-0123456789'

import {
  validateDemoWaitlistRequest,
  normalizeProgramInterest,
  saveDemoWaitlistEntry,
  waitlistIdempotencyDigest,
  handler as waitlistHandler,
} from '../netlify/functions/submit-demo-waitlist.js'
import { idempotencyDigest, sanitizeAttribution } from '../netlify/functions/submit-demo-registration.js'
import { RequestRejectedError } from '../netlify/functions/submit-enrollment-request.js'
import { DEMO_ELIGIBLE_PROGRAM_IDS } from '../lib/demo-eligibility.js'

const TEST_PROGRAM_ID = DEMO_ELIGIBLE_PROGRAM_IDS[0]
const OFFERING_ID = 'demo-off-1'
const NOW = Date.now()
const FUTURE = new Date(NOW + 30 * 24 * 60 * 60 * 1000).toISOString()
const PAST = new Date(NOW - 30 * 24 * 60 * 60 * 1000).toISOString()

function doc(data, exists = true) {
  return { exists, data: () => data }
}

function baseRequest(overrides = {}) {
  return {
    programId: TEST_PROGRAM_ID,
    demoOfferingId: OFFERING_ID,
    clientRequestId: 'client-request-id-12345',
    registration: {
      parentName: 'Jamie Parent',
      parentEmail: 'jamie@example.com',
      parentPhone: '6135551234',
      childName: 'Kiddo',
      childAge: 8,
      consentAccepted: true,
    },
    marketingAttribution: sanitizeAttribution({ landingPath: '/demo', source: 'flyer' }),
    ...overrides,
  }
}

function demoProgram(overrides = {}) {
  return { title: 'Smartivo', isActive: true, publicCatalogVersion: 1, demoEligible: true, ageRange: '6-12', ...overrides }
}

// Mirrors the live Sept 12 situation: seats remain internally (13 + 1 of 20)
// but staff paused public booking and switched the waitlist on.
function pausedOffering(overrides = {}) {
  return {
    programId: TEST_PROGRAM_ID,
    offeringType: 'demo',
    publicCatalogVersion: 1,
    isPublished: true,
    status: 'Open',
    capacity: 20,
    confirmedCount: 13,
    heldCount: 1,
    publicRegistrationPaused: true,
    waitlistEnabled: true,
    enrollmentOpenAt: PAST,
    enrollmentCloseAt: FUTURE,
    eventTitle: 'Young Engineers Demo Class — Kanata',
    eventStartAt: '2026-09-12T10:30:00-04:00',
    eventEndAt: '2026-09-12T11:30:00-04:00',
    timezone: 'America/Toronto',
    location: 'Ottawa Public Library - Hazeldean, 50 Castlefrank Rd, Ottawa, ON K2L 2N5',
    ...overrides,
  }
}

// ─── Minimal fake Firestore transaction harness ───────────────────────────
// Same semantics as the one in submit-demo-registration.test.mjs, including
// the reads-before-writes rule real Firestore transactions enforce.

function makeRef(collectionName, id) {
  return { collectionName, id }
}

function makeQuery(collectionName, filters) {
  return {
    __isQuery: true,
    collectionName,
    filters,
    where(field, op, value) { return makeQuery(collectionName, [...filters, { field, op, value }]) },
  }
}

class FakeTx {
  constructor(store) {
    this.store = store
    this.hasWritten = false
  }
  key(ref) { return `${ref.collectionName}/${ref.id}` }
  async get(ref) {
    if (this.hasWritten) throw new Error('Firestore transactions require all reads to be executed before all writes.')
    if (ref.__isQuery) {
      const docs = []
      for (const [key, data] of this.store.entries()) {
        if (!key.startsWith(`${ref.collectionName}/`) || data == null) continue
        if (ref.filters.every(f => data[f.field] === f.value)) docs.push({ id: key.split('/')[1], data: () => data })
      }
      return { empty: docs.length === 0, size: docs.length, docs }
    }
    const data = this.store.get(this.key(ref))
    return { exists: data != null, data: () => data }
  }
  create(ref, data) {
    this.hasWritten = true
    const k = this.key(ref)
    if (this.store.get(k) != null) throw new Error(`FakeTx.create: ${k} already exists`)
    this.store.set(k, data)
  }
  update(ref, data) {
    this.hasWritten = true
    this.store.set(this.key(ref), { ...(this.store.get(this.key(ref)) || {}), ...data })
  }
  set(ref, data, opts) {
    this.hasWritten = true
    const k = this.key(ref)
    this.store.set(k, { ...(opts?.merge ? (this.store.get(k) || {}) : {}), ...data })
  }
  delete(ref) {
    this.hasWritten = true
    this.store.delete(this.key(ref))
  }
}

function makeFakeDb(initial = {}) {
  const store = new Map(Object.entries(initial))
  let autoCounter = 0
  const db = {
    collection(name) {
      return {
        doc(id) { return makeRef(name, id ?? `auto-${name}-${autoCounter++}`) },
        where(field, op, value) { return makeQuery(name, [{ field, op, value }]) },
      }
    },
    async runTransaction(fn) {
      return fn(new FakeTx(store))
    },
  }
  return { db, store }
}

function seededDb(offeringOverrides = {}, extra = {}) {
  return makeFakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    [`programOfferings/${OFFERING_ID}`]: pausedOffering(offeringOverrides),
    ...extra,
  })
}

function collectionKeys(store, name) {
  return [...store.keys()].filter(key => key.startsWith(`${name}/`))
}

// ─── validateDemoWaitlistRequest ──────────────────────────────────────────

test('waitlist accepted when public booking is paused and waitlistEnabled is on', () => {
  const { offering } = validateDemoWaitlistRequest(baseRequest(), doc(demoProgram()), doc(pausedOffering()))
  assert.equal(offering.capacity, 20)
})

test('waitlist accepted when the demo is genuinely sold out (no pause flag)', () => {
  assert.doesNotThrow(() => validateDemoWaitlistRequest(
    baseRequest(),
    doc(demoProgram()),
    doc(pausedOffering({ publicRegistrationPaused: undefined, confirmedCount: 20, heldCount: 0 })),
  ))
})

test('waitlist rejected while the demo is still publicly bookable', () => {
  assert.throws(
    () => validateDemoWaitlistRequest(baseRequest(), doc(demoProgram()), doc(pausedOffering({ publicRegistrationPaused: false }))),
    err => err instanceof RequestRejectedError && err.statusCode === 409 && /register instead/.test(err.message),
  )
})

test('waitlist rejected when the offering waitlist switch is off or missing', () => {
  for (const waitlistEnabled of [false, undefined, 'true']) {
    assert.throws(
      () => validateDemoWaitlistRequest(baseRequest(), doc(demoProgram()), doc(pausedOffering({ waitlistEnabled }))),
      err => err instanceof RequestRejectedError && /waitlist is not open/.test(err.message),
    )
  }
})

// The September 12 regression: once enrollmentCloseAt passed, the offering
// state became 'closed' and every waitlist join was refused, which is what
// made /demo's waitlist vanish after the event. A closed window now means
// the family is waiting for the NEXT demo, not a seat at this one.
test('waitlist accepted after the registration window closes, tagged next_demo', () => {
  const result = validateDemoWaitlistRequest(
    baseRequest(),
    doc(demoProgram()),
    doc(pausedOffering({ enrollmentCloseAt: PAST })),
  )
  assert.equal(result.waitlistKind, 'next_demo')
})

test('a join while the demo is still upcoming and full is tagged sold_out', () => {
  const result = validateDemoWaitlistRequest(baseRequest(), doc(demoProgram()), doc(pausedOffering()))
  assert.equal(result.waitlistKind, 'sold_out')
})

test('waitlist still rejected after the window closes when the waitlist switch is off', () => {
  assert.throws(
    () => validateDemoWaitlistRequest(
      baseRequest(),
      doc(demoProgram()),
      doc(pausedOffering({ enrollmentCloseAt: PAST, waitlistEnabled: false })),
    ),
    err => err instanceof RequestRejectedError && /waitlist is not open/.test(err.message),
  )
})

test('program interest is normalized to the known options only', () => {
  assert.equal(normalizeProgramInterest('Bricks-Challenge'), 'bricks-challenge')
  assert.equal(normalizeProgramInterest(' not-sure '), 'not-sure')
  for (const value of ['', 'chess-club', null, undefined, 42, { id: 'smartivo' }]) {
    assert.equal(normalizeProgramInterest(value), null)
  }
})

test('waitlist rejected for an unpublished or non-demo offering', () => {
  for (const overrides of [{ isPublished: false }, { offeringType: 'regular' }]) {
    assert.throws(
      () => validateDemoWaitlistRequest(baseRequest(), doc(demoProgram()), doc(pausedOffering(overrides))),
      RequestRejectedError,
    )
  }
})

// ─── saveDemoWaitlistEntry ────────────────────────────────────────────────

test('saveDemoWaitlistEntry writes one Waiting demo entry and nothing a booking would', async () => {
  const { db, store } = seededDb()
  const saved = await saveDemoWaitlistEntry(db, baseRequest())

  assert.equal(saved.duplicate, false)
  assert.match(saved.reference, /^WL-[0-9A-F]{8}$/)

  const [entryKey] = collectionKeys(store, 'waitlist')
  const entry = store.get(entryKey)
  assert.equal(entry.waitlistType, 'demo')
  assert.equal(entry.status, 'Waiting')
  assert.equal(entry.position, 1)
  assert.equal(entry.offeringId, OFFERING_ID)
  assert.equal(entry.publicReference, saved.reference)
  assert.equal(entry.eventSnapshot.eventTitle, 'Young Engineers Demo Class — Kanata')
  assert.equal(entry.marketingAttribution.source, 'flyer')
  assert.equal(entry.demoWaitlistKind, 'sold_out')
  assert.equal(entry.programInterest, null)

  // Inert: no seat hold, no DEMO number, no eligibility lock, no credit, no registration.
  const offering = store.get(`programOfferings/${OFFERING_ID}`)
  assert.equal(offering.heldCount, 1)
  assert.equal(offering.confirmedCount, 13)
  for (const name of ['demoRegistrations', 'demoCredits', 'demoEligibilityLocks', 'counters', 'registrations']) {
    assert.deepEqual(collectionKeys(store, name), [], name)
  }
  assert.equal(store.get(`waitlistCounters/offeringId-${OFFERING_ID}`).lastPosition, 1)
})

test('saveDemoWaitlistEntry records the next-demo kind and the program interest', async () => {
  const { db, store } = seededDb({ enrollmentCloseAt: PAST })
  await saveDemoWaitlistEntry(db, { ...baseRequest(), programInterest: 'algo-play' })

  const [entryKey] = collectionKeys(store, 'waitlist')
  const entry = store.get(entryKey)
  assert.equal(entry.demoWaitlistKind, 'next_demo')
  assert.equal(entry.programInterest, 'algo-play')
  assert.equal(entry.status, 'Waiting')
})

test('saveDemoWaitlistEntry continues the per-offering position sequence', async () => {
  const { db, store } = seededDb({}, {
    [`waitlistCounters/offeringId-${OFFERING_ID}`]: { lastPosition: 4 },
  })
  await saveDemoWaitlistEntry(db, baseRequest())
  const entry = store.get(collectionKeys(store, 'waitlist')[0])
  assert.equal(entry.position, 5)
})

test('saveDemoWaitlistEntry seeds the position from existing entries when no counter exists', async () => {
  const { db, store } = seededDb({}, {
    'waitlist/existing-1': { offeringId: OFFERING_ID, position: 2 },
    'waitlist/other-offering': { offeringId: 'someone-else', position: 9 },
  })
  await saveDemoWaitlistEntry(db, baseRequest())
  const created = collectionKeys(store, 'waitlist').filter(key => !['waitlist/existing-1', 'waitlist/other-offering'].includes(key))
  assert.equal(store.get(created[0]).position, 3)
})

test('saveDemoWaitlistEntry returns the original entry for a repeated clientRequestId', async () => {
  const { db, store } = seededDb()
  const first = await saveDemoWaitlistEntry(db, baseRequest())
  const second = await saveDemoWaitlistEntry(db, baseRequest())
  assert.equal(second.duplicate, true)
  assert.equal(second.reference, first.reference)
  assert.equal(collectionKeys(store, 'waitlist').length, 1)
})

test('saveDemoWaitlistEntry writes nothing when the waitlist is not open', async () => {
  const { db, store } = seededDb({ waitlistEnabled: false })
  const before = [...store.entries()]
  await assert.rejects(() => saveDemoWaitlistEntry(db, baseRequest()), RequestRejectedError)
  assert.deepEqual([...store.entries()], before)
})

test('waitlist and registration idempotency keys never collide for the same clientRequestId', () => {
  assert.notEqual(waitlistIdempotencyDigest(baseRequest()), idempotencyDigest(baseRequest()))
})

// ─── handler gate ─────────────────────────────────────────────────────────

test('submit-demo-waitlist handler returns 503 when ENABLE_DEMO_PAYMENTS is not set', async () => {
  const previous = process.env.ENABLE_DEMO_PAYMENTS
  delete process.env.ENABLE_DEMO_PAYMENTS
  const response = await waitlistHandler({ httpMethod: 'POST', body: JSON.stringify(baseRequest()) })
  assert.equal(response.statusCode, 503)
  if (previous !== undefined) process.env.ENABLE_DEMO_PAYMENTS = previous
})

test('submit-demo-waitlist handler rejects non-POST methods', async () => {
  const response = await waitlistHandler({ httpMethod: 'GET' })
  assert.equal(response.statusCode, 405)
})
