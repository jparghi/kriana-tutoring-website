import test from 'node:test'
import assert from 'node:assert/strict'
import Stripe from 'stripe'

// Fixed, deterministic test-only salt (32+ chars, matches production's
// >=32-char requirement). Never a real secret.
process.env.DEMO_ELIGIBILITY_KEY_SALT = 'test-demo-eligibility-salt-0123456789'

import {
  validatePayload,
  validateDemoCatalogueRequest,
  computeChildEligibilityKeyHash,
  saveDemoRegistration,
  idempotencyDigest,
  sanitizeAttribution,
  handler as submitDemoHandler,
} from '../netlify/functions/submit-demo-registration.js'
import { RequestRejectedError } from '../netlify/functions/submit-enrollment-request.js'
import { getDemoPricing } from '../lib/robotics-packages.js'
import { DEMO_ELIGIBLE_PROGRAM_IDS } from '../lib/demo-eligibility.js'
import { reconcileDemoWebhookEvent, handler as webhookHandler } from '../netlify/functions/demo-payment-webhook.js'
import { idempotencyKeyForDemoRegistration, handler as createSessionHandler } from '../netlify/functions/create-demo-payment-session.js'

function doc(data, exists = true) {
  return { exists, data: () => data }
}

// Any real allowlisted program ID works here — the fixtures below don't care
// which one, they just need to pass isDemoEligibleProgramId().
const TEST_PROGRAM_ID = DEMO_ELIGIBLE_PROGRAM_IDS[0]

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
    consentAccepted: true,
    ...overrides,
  }
}

function baseRequest(overrides = {}) {
  return {
    programId: TEST_PROGRAM_ID,
    demoOfferingId: 'demo-off-1',
    clientRequestId: 'client-request-id-12345',
    registration: baseRegistration(),
    marketingAttribution: sanitizeAttribution({
      landingPath: '/demo',
      source: 'facebook',
      medium: 'paid_social',
      campaign: 'demo_sep_2026',
      content: null,
      term: null,
      referrer: 'https://www.facebook.com/some/path',
    }),
    ...overrides,
  }
}

function demoProgram(overrides = {}) {
  return {
    title: 'Smartivo',
    isActive: true,
    publicCatalogVersion: 1,
    demoEligible: true,
    ageRange: '6-12',
    ...overrides,
  }
}

function demoOffering(overrides = {}) {
  return {
    programId: TEST_PROGRAM_ID,
    offeringType: 'demo',
    publicCatalogVersion: 1,
    isPublished: true,
    status: 'Open',
    capacity: 10,
    confirmedCount: 0,
    heldCount: 0,
    enrollmentOpenAt: PAST,
    enrollmentCloseAt: FUTURE,
    eventTitle: 'Young Engineers Demo Class — Kanata',
    eventStartAt: '2026-09-12T10:30:00-04:00',
    eventEndAt: '2026-09-12T11:30:00-04:00',
    timezone: 'America/Toronto',
    location: 'Hazeldean Library, 50 Castlefrank Road, Ottawa, ON K2L 2N5',
    ...overrides,
  }
}

// ─── Lightweight fake Firestore transaction harness ────────────────────────
//
// Real Firestore transaction races across two concurrent clients cannot be
// simulated without an emulator, so this harness only proves single-call
// behavior (what data gets read/written for one call) and the *shape* of the
// concurrency primitive used (tx.create vs tx.set — see the dedicated test
// below for why that distinction is what actually gives us atomicity).

function makeRef(collectionName, id) {
  return { collectionName, id }
}

function makeQuery(collectionName, filters, limitN) {
  return {
    __isQuery: true,
    collectionName,
    filters,
    limitN,
    where(field, op, value) { return makeQuery(collectionName, [...filters, { field, op, value }], limitN) },
    limit(n) { return makeQuery(collectionName, filters, n) },
  }
}

class FakeTx {
  constructor(store) {
    this.store = store
    this.writes = { creates: [], updates: [], sets: [], deletes: [] }
    this.hasWritten = false
  }
  key(ref) { return `${ref.collectionName}/${ref.id}` }
  async get(ref) {
    // Real Firestore transactions require every read to happen before the
    // first write — this is exactly the ordering bug that shipped past this
    // suite once already (a counter read placed after tx.create/tx.update
    // calls), so this check now mirrors production instead of silently
    // allowing it.
    if (this.hasWritten) {
      throw new Error('Firestore transactions require all reads to be executed before all writes.')
    }
    if (ref.__isQuery) {
      const docs = []
      for (const [key, data] of this.store.entries()) {
        if (!key.startsWith(`${ref.collectionName}/`) || data == null) continue
        const matches = ref.filters.every(f => data[f.field] === f.value)
        if (matches) {
          const id = key.slice(ref.collectionName.length + 1)
          docs.push({ id, data: () => data, ref: makeRef(ref.collectionName, id) })
        }
      }
      const limited = ref.limitN ? docs.slice(0, ref.limitN) : docs
      return { empty: limited.length === 0, size: limited.length, docs: limited }
    }
    const data = this.store.get(this.key(ref))
    return { exists: data != null, data: () => data }
  }
  create(ref, data) {
    this.hasWritten = true
    const k = this.key(ref)
    if (this.store.get(k) != null) {
      throw new Error(`FakeTx.create: ${k} already exists (this IS the atomicity primitive being tested)`)
    }
    this.store.set(k, data)
    this.writes.creates.push({ ref, data })
  }
  update(ref, data) {
    this.hasWritten = true
    const k = this.key(ref)
    this.store.set(k, { ...(this.store.get(k) || {}), ...data })
    this.writes.updates.push({ ref, data })
  }
  set(ref, data, opts) {
    this.hasWritten = true
    const k = this.key(ref)
    const base = opts?.merge ? (this.store.get(k) || {}) : {}
    this.store.set(k, { ...base, ...data })
    this.writes.sets.push({ ref, data, opts })
  }
  delete(ref) {
    this.hasWritten = true
    this.store.delete(this.key(ref))
    this.writes.deletes.push({ ref })
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
      const tx = new FakeTx(store)
      const result = await fn(tx)
      db.lastWrites = tx.writes
      return result
    },
  }
  return { db, store }
}

// ─── validatePayload ────────────────────────────────────────────────────

test('validatePayload accepts a complete, valid demo request', () => {
  const result = validatePayload(baseRequest())
  assert.equal(result.error, undefined)
})

test('validatePayload never accepts or reads packageId or price from the body', () => {
  const result = validatePayload({ ...baseRequest(), packageId: 'engineer', priceCents: 1 })
  assert.equal(result.error, undefined)
  assert.ok(!('packageId' in result))
  assert.ok(!('priceCents' in result))
})

test('getDemoPricing always resolves to 1000 cents CAD', () => {
  assert.deepEqual(getDemoPricing(), { priceCents: 1000, currency: 'CAD' })
})

const REQUIRED_STRING_FIELDS = ['parentName', 'parentEmail', 'parentPhone', 'childName']
for (const field of REQUIRED_STRING_FIELDS) {
  test(`validatePayload rejects when ${field} is missing`, () => {
    const registration = baseRegistration({ [field]: '' })
    const result = validatePayload(baseRequest({ registration }))
    assert.ok(result.error, `expected a validation error when ${field} is missing`)
  })
}

test('validatePayload rejects when childAge is missing/invalid', () => {
  const result = validatePayload(baseRequest({ registration: baseRegistration({ childAge: '' }) }))
  assert.ok(result.error)
})

test('validatePayload rejects when consentAccepted is missing', () => {
  const result = validatePayload(baseRequest({ registration: baseRegistration({ consentAccepted: false }) }))
  assert.equal(result.error, 'Consent is required before submitting.')
})

test('validatePayload rejects an invalid clientRequestId', () => {
  const result = validatePayload(baseRequest({ clientRequestId: 'short' }))
  assert.equal(result.error, 'Request identifier is invalid.')
})

// ─── sanitizeAttribution ────────────────────────────────────────────────

test('sanitizeAttribution keeps a valid, complete attribution object', () => {
  const result = sanitizeAttribution({
    landingPath: '/demo',
    source: 'facebook',
    medium: 'paid_social',
    campaign: 'demo_sep_2026',
    content: 'vertical_video_01',
    term: null,
    referrer: 'https://www.facebook.com/some/path?query=1',
  })
  assert.equal(result.landingPath, '/demo')
  assert.equal(result.source, 'facebook')
  assert.equal(result.medium, 'paid_social')
  assert.equal(result.campaign, 'demo_sep_2026')
  assert.equal(result.content, 'vertical_video_01')
  assert.equal(result.term, null)
  // Referrer is sanitized to origin only — no path or query string kept.
  assert.equal(result.referrer, 'https://www.facebook.com')
})

for (const bad of [null, undefined, 'a string', ['array'], 42]) {
  test(`sanitizeAttribution never throws and returns an all-null object for ${JSON.stringify(bad)}`, () => {
    const result = sanitizeAttribution(bad)
    assert.equal(result.landingPath, null)
    assert.equal(result.source, null)
    assert.equal(result.referrer, null)
  })
}

test('sanitizeAttribution truncates an oversized field rather than rejecting it', () => {
  const result = sanitizeAttribution({ source: 'x'.repeat(500) })
  assert.equal(result.source.length, 80)
})

test('sanitizeAttribution treats a malformed referrer as null, never throws', () => {
  const result = sanitizeAttribution({ referrer: 'not-a-valid-url' })
  assert.equal(result.referrer, null)
})

test('sanitizeAttribution only sets landingPath to "/demo" when the raw value is exactly that', () => {
  assert.equal(sanitizeAttribution({ landingPath: '/booking/xyz' }).landingPath, null)
  assert.equal(sanitizeAttribution({ landingPath: '/demo' }).landingPath, '/demo')
})

test('validatePayload with a garbage marketingAttribution still returns a valid, non-error result', () => {
  for (const bad of ['a string', ['array'], 42, { foo: 'bar' }]) {
    const result = validatePayload(baseRequest({ marketingAttribution: bad }))
    assert.equal(result.error, undefined)
    assert.equal(result.marketingAttribution.source, null)
  }
})

// ─── validateDemoCatalogueRequest ──────────────────────────────────────────

test('demo accepted for each of the 3 eligible programs', () => {
  for (const programId of DEMO_ELIGIBLE_PROGRAM_IDS) {
    const request = baseRequest({ programId })
    const { program, offering } = validateDemoCatalogueRequest(
      request,
      doc(demoProgram()),
      doc(demoOffering({ programId })),
    )
    assert.equal(offering.programId, programId)
    assert.ok(program.demoEligible)
  }
})

test('demo rejected for an ineligible program (not in the code allowlist)', () => {
  const request = baseRequest({ programId: 'galileo-technic' })
  assert.throws(
    () => validateDemoCatalogueRequest(request, doc(demoProgram({ demoEligible: false })), doc(demoOffering({ programId: 'galileo-technic' }))),
    RequestRejectedError,
  )
})

test('demo rejected when the Firestore demoEligible flag is false, even for an allowlisted program id (defense in depth)', () => {
  const request = baseRequest({ programId: TEST_PROGRAM_ID })
  assert.throws(
    () => validateDemoCatalogueRequest(request, doc(demoProgram({ demoEligible: false })), doc(demoOffering())),
    RequestRejectedError,
  )
})

test('validateDemoCatalogueRequest rejects an offering that is not offeringType "demo"', () => {
  const request = baseRequest()
  assert.throws(
    () => validateDemoCatalogueRequest(request, doc(demoProgram()), doc(demoOffering({ offeringType: undefined }))),
    RequestRejectedError,
  )
})

test('validateDemoCatalogueRequest rejects a full/no-capacity demo offering', () => {
  const request = baseRequest()
  assert.throws(
    () => validateDemoCatalogueRequest(request, doc(demoProgram()), doc(demoOffering({ capacity: 5, confirmedCount: 5, heldCount: 0 }))),
    err => err instanceof RequestRejectedError && /full/.test(err.message),
  )
})

// ─── computeChildEligibilityKeyHash ─────────────────────────────────────

test('computeChildEligibilityKeyHash is stable for identical input', () => {
  const a = computeChildEligibilityKeyHash(baseRegistration())
  const b = computeChildEligibilityKeyHash(baseRegistration())
  assert.equal(a, b)
})

test('computeChildEligibilityKeyHash changes when childName, parentEmail, or parentPhone changes', () => {
  const base = computeChildEligibilityKeyHash(baseRegistration())
  assert.notEqual(base, computeChildEligibilityKeyHash(baseRegistration({ childName: 'Someone Else' })))
  assert.notEqual(base, computeChildEligibilityKeyHash(baseRegistration({ parentEmail: 'other@example.com' })))
  assert.notEqual(base, computeChildEligibilityKeyHash(baseRegistration({ parentPhone: '6135559999' })))
})

test('computeChildEligibilityKeyHash throws when the salt is missing (fail closed, not silently skipped)', () => {
  const saved = process.env.DEMO_ELIGIBILITY_KEY_SALT
  delete process.env.DEMO_ELIGIBILITY_KEY_SALT
  try {
    assert.throws(() => computeChildEligibilityKeyHash(baseRegistration()), /DEMO_ELIGIBILITY_KEY_SALT/)
  } finally {
    process.env.DEMO_ELIGIBILITY_KEY_SALT = saved
  }
})

// ─── idempotencyDigest ──────────────────────────────────────────────────

test('idempotencyDigest is stable for identical requests', () => {
  const a = idempotencyDigest(baseRequest())
  const b = idempotencyDigest(baseRequest())
  assert.equal(a, b)
})

// ─── saveDemoRegistration (fake transaction harness) ───────────────────

test('saveDemoRegistration succeeds and writes registered/pending_attendance records at $10 CAD', async () => {
  const { db } = makeFakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    'programOfferings/demo-off-1': demoOffering(),
  })
  const result = await saveDemoRegistration(db, baseRequest())
  assert.equal(result.duplicate, false)
  assert.match(result.reference, /^DEMO-\d{4}-\d{4}$/)

  const registrationCreate = db.lastWrites.creates.find(c => c.ref.collectionName === 'demoRegistrations')
  assert.ok(registrationCreate)
  assert.equal(registrationCreate.data.demoStatus, 'registered')
  assert.equal(registrationCreate.data.paymentStatus, 'pending')
  assert.equal(registrationCreate.data.priceCents, 1000)
  assert.equal(registrationCreate.data.currency, 'CAD')
  assert.equal(registrationCreate.data.registrationType, 'demo')

  // Event/offering snapshot — so a later admin edit to the offering never
  // rewrites what this registration's confirmation page/email already said.
  assert.equal(registrationCreate.data.eventSnapshot.eventTitle, 'Young Engineers Demo Class — Kanata')
  assert.equal(registrationCreate.data.eventSnapshot.location, 'Hazeldean Library, 50 Castlefrank Road, Ottawa, ON K2L 2N5')
  assert.equal(registrationCreate.data.eventSnapshot.ageRange, '6-12')
  assert.equal(registrationCreate.data.eventSnapshot.registrationReference, result.reference)

  // Sanitized marketing attribution, captured server-side.
  assert.equal(registrationCreate.data.marketingAttribution.source, 'facebook')
  assert.equal(registrationCreate.data.marketingAttribution.campaign, 'demo_sep_2026')
  assert.ok('capturedAt' in registrationCreate.data.marketingAttribution)

  const creditCreate = db.lastWrites.creates.find(c => c.ref.collectionName === 'demoCredits')
  assert.ok(creditCreate)
  assert.equal(creditCreate.data.status, 'pending_attendance')
  assert.equal(creditCreate.data.amountCents, 1000)
  assert.equal(creditCreate.ref.id, registrationCreate.ref.id, 'demoCredits doc id must equal the demoRegistration id (1:1)')
})

test('saveDemoRegistration succeeds with no marketingAttribution at all — missing attribution never blocks registration', async () => {
  const { db } = makeFakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    'programOfferings/demo-off-1': demoOffering(),
  })
  const request = baseRequest({ marketingAttribution: sanitizeAttribution(undefined) })
  const result = await saveDemoRegistration(db, request)
  assert.equal(result.duplicate, false)
  const registrationCreate = db.lastWrites.creates.find(c => c.ref.collectionName === 'demoRegistrations')
  assert.equal(registrationCreate.data.marketingAttribution.source, null)
  assert.equal(registrationCreate.data.marketingAttribution.landingPath, null)
})

test('saveDemoRegistration creates the eligibility lock via tx.create (atomic dedup), never tx.set', async () => {
  // tx.create() is what makes this check safe under a real concurrent race:
  // Firestore fails the whole transaction if the target document already
  // exists. tx.set() would silently overwrite instead, defeating the
  // uniqueness guarantee. A literal two-concurrent-transaction race can't be
  // simulated without a Firestore emulator, so this test instead locks in
  // that the correct primitive is used.
  const { db } = makeFakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    'programOfferings/demo-off-1': demoOffering(),
  })
  await saveDemoRegistration(db, baseRequest())
  const lockCreate = db.lastWrites.creates.find(c => c.ref.collectionName === 'demoEligibilityLocks')
  assert.ok(lockCreate, 'expected a tx.create() call for the eligibility lock')
  const lockSet = db.lastWrites.sets.find(c => c.ref.collectionName === 'demoEligibilityLocks')
  assert.equal(lockSet, undefined, 'the eligibility lock must never be written via tx.set()')
})

test('saveDemoRegistration rejects a duplicate demo for the same child when a lock already exists', async () => {
  const registration = baseRegistration()
  const hash = computeChildEligibilityKeyHash(registration)
  const { db } = makeFakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    'programOfferings/demo-off-1': demoOffering(),
    [`demoEligibilityLocks/${hash}`]: { demoRegistrationId: 'existing-reg', createdAt: null },
  })
  await assert.rejects(
    () => saveDemoRegistration(db, baseRequest({ registration })),
    err => err instanceof RequestRejectedError && err.statusCode === 409 && /already used their one-time/.test(err.message),
  )
})

test('saveDemoRegistration returns the existing result for a repeated clientRequestId (idempotency)', async () => {
  const request = baseRequest()
  const digest = idempotencyDigest(request)
  const { db } = makeFakeDb({
    [`programs/${TEST_PROGRAM_ID}`]: demoProgram(),
    'programOfferings/demo-off-1': demoOffering(),
    [`demoRequestKeys/${digest}`]: {
      demoRegistrationId: 'already-saved-id',
      reference: 'DEMO-2026-0001',
      expiresAt: { toMillis: () => Date.now() + 1000 * 60 },
    },
  })
  const result = await saveDemoRegistration(db, request)
  assert.equal(result.duplicate, true)
  assert.equal(result.id, 'already-saved-id')
  assert.equal(result.reference, 'DEMO-2026-0001')
})

// ─── handler-level fail-closed gate ─────────────────────────────────────
//
// ENABLE_DEMO_PAYMENTS is checked first, before getAdminDb() is ever called,
// so this is safely testable end-to-end without mocking Firebase Admin.

test('submit-demo-registration handler returns 503 when ENABLE_DEMO_PAYMENTS is not set', async () => {
  const saved = process.env.ENABLE_DEMO_PAYMENTS
  delete process.env.ENABLE_DEMO_PAYMENTS
  try {
    const response = await submitDemoHandler({ httpMethod: 'POST', body: '{}' })
    assert.equal(response.statusCode, 503)
  } finally {
    if (saved !== undefined) process.env.ENABLE_DEMO_PAYMENTS = saved
  }
})

test('submit-demo-registration handler returns 503 even for a misspelled/truthy-looking value (fail closed)', async () => {
  const saved = process.env.ENABLE_DEMO_PAYMENTS
  process.env.ENABLE_DEMO_PAYMENTS = 'TRUE'
  try {
    const response = await submitDemoHandler({ httpMethod: 'POST', body: '{}' })
    assert.equal(response.statusCode, 503)
  } finally {
    if (saved === undefined) delete process.env.ENABLE_DEMO_PAYMENTS
    else process.env.ENABLE_DEMO_PAYMENTS = saved
  }
})

test('create-demo-payment-session handler returns 503 when ENABLE_DEMO_PAYMENTS is not set', async () => {
  const saved = process.env.ENABLE_DEMO_PAYMENTS
  delete process.env.ENABLE_DEMO_PAYMENTS
  try {
    const response = await createSessionHandler({ httpMethod: 'POST', body: '{"demoRegistrationId":"x"}' })
    assert.equal(response.statusCode, 503)
  } finally {
    if (saved !== undefined) process.env.ENABLE_DEMO_PAYMENTS = saved
  }
})

test('demo-payment-webhook handler returns 503 when ENABLE_DEMO_PAYMENTS is not set', async () => {
  const saved = process.env.ENABLE_DEMO_PAYMENTS
  delete process.env.ENABLE_DEMO_PAYMENTS
  try {
    const response = await webhookHandler({ httpMethod: 'POST', body: '{}', headers: {} })
    assert.equal(response.statusCode, 503)
  } finally {
    if (saved !== undefined) process.env.ENABLE_DEMO_PAYMENTS = saved
  }
})

// ─── create-demo-payment-session idempotency ────────────────────────────

test('idempotencyKeyForDemoRegistration is deterministic given the same demoRegistrationId', () => {
  assert.equal(idempotencyKeyForDemoRegistration('reg-123'), idempotencyKeyForDemoRegistration('reg-123'))
  assert.notEqual(idempotencyKeyForDemoRegistration('reg-123'), idempotencyKeyForDemoRegistration('reg-456'))
  assert.equal(idempotencyKeyForDemoRegistration('reg-123'), 'demo-session-reg-123')
})

// ─── demo-payment-webhook: signature verification ───────────────────────
//
// Tested directly against the Stripe SDK's own signing/verification
// contract (the exact mechanism the handler calls into via
// stripe.webhooks.constructEvent), rather than by invoking the full Netlify
// handler — the handler additionally requires live Firebase Admin
// credentials that aren't available in this environment. The reconciliation
// logic itself (reconcileDemoWebhookEvent, tested below) is exercised
// entirely separately from signature verification, exactly because the file
// is structured that way.

test('a validly-signed webhook payload verifies successfully', () => {
  const secret = 'whsec_test_secret_0123456789'
  const payload = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed', data: { object: {} } })
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret })
  const event = Stripe.webhooks.constructEvent(payload, header, secret)
  assert.equal(event.id, 'evt_test')
})

test('an invalid signature is rejected', () => {
  const secret = 'whsec_test_secret_0123456789'
  const payload = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed', data: { object: {} } })
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_wrong_secret_9876543210' })
  assert.throws(() => Stripe.webhooks.constructEvent(payload, header, secret))
})

// ─── demo-payment-webhook: reconciliation ───────────────────────────────

test('reconcileDemoWebhookEvent: checkout.session.completed transitions pending -> paid and confirms the held seat', async () => {
  const { db, store } = makeFakeDb({
    'demoRegistrations/reg-1': { demoOfferingId: 'off-1', paymentStatus: 'pending', priceCents: 1000, currency: 'CAD' },
  })
  const stripeEvent = {
    id: 'evt_1',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_1', amount_total: 1000, currency: 'cad', payment_intent: 'pi_1', metadata: { demoRegistrationId: 'reg-1' } } },
  }
  await reconcileDemoWebhookEvent(db, stripeEvent)
  assert.equal(store.get('demoRegistrations/reg-1').paymentStatus, 'paid')
  const offeringUpdate = db.lastWrites.updates.find(u => u.ref.collectionName === 'programOfferings' && u.ref.id === 'off-1')
  assert.ok(offeringUpdate, 'expected the offering hold to be moved toward confirmed')
  assert.ok('heldCount' in offeringUpdate.data && 'confirmedCount' in offeringUpdate.data)
})

test('reconcileDemoWebhookEvent: amount/currency mismatch is rejected (defense in depth)', async () => {
  const { db, store } = makeFakeDb({
    'demoRegistrations/reg-1': { demoOfferingId: 'off-1', paymentStatus: 'pending', priceCents: 1000, currency: 'CAD' },
  })
  const stripeEvent = {
    id: 'evt_tampered',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_1', amount_total: 1, currency: 'usd', metadata: { demoRegistrationId: 'reg-1' } } },
  }
  await reconcileDemoWebhookEvent(db, stripeEvent)
  assert.equal(store.get('demoRegistrations/reg-1').paymentStatus, 'pending', 'must not transition on a mismatched amount/currency')
})

test('reconcileDemoWebhookEvent: checkout.session.expired cancels, releases the hold, voids the credit, and deletes the lock', async () => {
  const { db, store } = makeFakeDb({
    'demoRegistrations/reg-1': { demoOfferingId: 'off-1', paymentStatus: 'pending', childEligibilityKeyHash: 'hash-1' },
    'demoCredits/reg-1': { status: 'pending_attendance' },
    'demoEligibilityLocks/hash-1': { demoRegistrationId: 'reg-1' },
  })
  const stripeEvent = {
    id: 'evt_2',
    type: 'checkout.session.expired',
    data: { object: { id: 'cs_2', metadata: { demoRegistrationId: 'reg-1' } } },
  }
  await reconcileDemoWebhookEvent(db, stripeEvent)
  assert.equal(store.get('demoRegistrations/reg-1').paymentStatus, 'canceled')
  assert.equal(store.get('demoRegistrations/reg-1').demoStatus, 'cancelled')
  assert.equal(store.get('demoCredits/reg-1').status, 'void')
  assert.equal(store.get('demoEligibilityLocks/hash-1'), undefined, 'the lock must be deleted so the family can retry')
})

test('reconcileDemoWebhookEvent: charge.refunded voids an available credit but leaves an already-applied credit untouched', async () => {
  const { db, store } = makeFakeDb({
    'demoRegistrations/reg-1': { paymentIntentId: 'pi_1', paymentStatus: 'paid' },
    'demoCredits/reg-1': { status: 'available' },
    'demoRegistrations/reg-2': { paymentIntentId: 'pi_2', paymentStatus: 'paid' },
    'demoCredits/reg-2': { status: 'applied' },
  })
  await reconcileDemoWebhookEvent(db, { id: 'evt_r1', type: 'charge.refunded', data: { object: { payment_intent: 'pi_1' } } })
  await reconcileDemoWebhookEvent(db, { id: 'evt_r2', type: 'charge.refunded', data: { object: { payment_intent: 'pi_2' } } })

  assert.equal(store.get('demoRegistrations/reg-1').paymentStatus, 'refunded')
  assert.equal(store.get('demoCredits/reg-1').status, 'void')
  assert.equal(store.get('demoRegistrations/reg-2').paymentStatus, 'refunded')
  assert.equal(store.get('demoCredits/reg-2').status, 'applied', 'an already-applied credit must be left untouched here')
})

test('reconcileDemoWebhookEvent: a duplicate event.id is a no-op on the second delivery', async () => {
  const { db, store } = makeFakeDb({
    'demoRegistrations/reg-1': { demoOfferingId: 'off-1', paymentStatus: 'pending', priceCents: 1000, currency: 'CAD' },
    'processedDemoWebhookEvents/evt_1': { type: 'checkout.session.completed', processedAt: null },
  })
  const stripeEvent = {
    id: 'evt_1',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_1', amount_total: 1000, currency: 'cad', metadata: { demoRegistrationId: 'reg-1' } } },
  }
  await reconcileDemoWebhookEvent(db, stripeEvent)
  assert.equal(store.get('demoRegistrations/reg-1').paymentStatus, 'pending', 'a duplicate delivery must not reconcile a second time')
})
