import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CURRENT_MEDIA_CONSENT_EVENT_ID,
  GENERAL_MEDIA_CONSENT_ID,
  MEDIA_CONSENT_VERSION,
  validateMediaConsentPayload,
} from '../lib/media-consent.js'
import { mediaConsentSubjectKey, saveMediaConsent } from '../netlify/functions/submit-media-consent.js'

function baseBody(overrides = {}) {
  return {
    eventId: CURRENT_MEDIA_CONSENT_EVENT_ID,
    clientRequestId: 'client-request-id-12345',
    parentName: 'Jamie Parent',
    childName: 'Alex Parent',
    parentEmail: 'Jamie@Example.com',
    parentPhone: '613-555-1234',
    sessionId: 'pm',
    choice: 'YES',
    signature: 'Jamie Parent',
    website: '',
    ...overrides,
  }
}

// ─── Minimal Firestore fake (reads-before-writes enforced) ────────────────

function makeQuery(collectionName, filters) {
  return {
    __isQuery: true,
    collectionName,
    filters,
    where(field, op, value) { return makeQuery(collectionName, [...filters, { field, op, value }]) },
  }
}

class FakeTx {
  constructor(store) { this.store = store; this.hasWritten = false }
  key(ref) { return `${ref.collectionName}/${ref.id}` }
  async get(ref) {
    if (this.hasWritten) throw new Error('Firestore transactions require all reads to be executed before all writes.')
    const docs = []
    for (const [key, data] of this.store.entries()) {
      if (!key.startsWith(`${ref.collectionName}/`)) continue
      if (ref.filters.every(f => data[f.field] === f.value)) docs.push({ id: key.split('/')[1], data: () => data })
    }
    return { empty: docs.length === 0, size: docs.length, docs }
  }
  create(ref, data) {
    this.hasWritten = true
    const k = this.key(ref)
    if (this.store.has(k)) throw new Error(`FakeTx.create: ${k} already exists`)
    this.store.set(k, data)
  }
  update(ref, data) {
    this.hasWritten = true
    const k = this.key(ref)
    if (!this.store.has(k)) throw new Error(`FakeTx.update: ${k} does not exist`)
    this.store.set(k, { ...this.store.get(k), ...data })
  }
}

function makeFakeDb() {
  const store = new Map()
  let autoCounter = 0
  const db = {
    collection(name) {
      return {
        doc(id) { return { collectionName: name, id: id ?? `auto-${autoCounter++}` } },
        where(field, op, value) { return makeQuery(name, [{ field, op, value }]) },
      }
    },
    runTransaction: fn => fn(new FakeTx(store)),
  }
  return { db, store }
}

async function submit(db, overrides = {}) {
  const validated = validateMediaConsentPayload(baseBody(overrides))
  assert.equal(validated.error, undefined)
  return saveMediaConsent(db, validated.consent, validated.clientRequestId)
}

function docs(store) {
  return [...store.entries()].map(([key, data]) => ({ id: key.split('/')[1], ...data }))
}

// ─── Validation ───────────────────────────────────────────────────────────

test('accepts YES and NO equally', () => {
  for (const choice of ['YES', 'NO']) {
    const result = validateMediaConsentPayload(baseBody({ choice }))
    assert.equal(result.error, undefined)
    assert.equal(result.consent.choice, choice)
  }
})

test('rejects a missing or unexpected choice — nothing is ever defaulted', () => {
  for (const choice of [undefined, '', 'yes', true, 'MAYBE']) {
    assert.match(validateMediaConsentPayload(baseBody({ choice })).error, /YES or NO/)
  }
})

test('requires a typed signature, parent, child, email and phone', () => {
  assert.match(validateMediaConsentPayload(baseBody({ signature: ' ' })).error, /signature/)
  assert.match(validateMediaConsentPayload(baseBody({ parentName: '' })).error, /parent/i)
  assert.match(validateMediaConsentPayload(baseBody({ childName: '' })).error, /child/i)
  assert.match(validateMediaConsentPayload(baseBody({ parentEmail: 'nope' })).error, /email/)
  assert.match(validateMediaConsentPayload(baseBody({ parentPhone: '12' })).error, /phone/)
})

test('session is optional but must be a real session when given', () => {
  assert.equal(validateMediaConsentPayload(baseBody({ sessionId: '' })).consent.sessionId, 'unknown')
  assert.equal(validateMediaConsentPayload(baseBody({ sessionId: 'am' })).consent.sessionId, 'am')
  assert.match(validateMediaConsentPayload(baseBody({ sessionId: 'evening' })).error, /session/)
})

test('rejects unknown events, including prototype keys', () => {
  assert.match(validateMediaConsentPayload(baseBody({ eventId: 'nope' })).error, /recognise/)
  assert.match(validateMediaConsentPayload(baseBody({ eventId: 'constructor' })).error, /recognise/)
})

test('honeypot is flagged, not saved', () => {
  assert.deepEqual(validateMediaConsentPayload(baseBody({ website: 'spam.example' })), { honeypotTriggered: true })
})

test('subject key ignores email case and name spacing', () => {
  const a = validateMediaConsentPayload(baseBody()).consent
  const b = validateMediaConsentPayload(baseBody({ parentEmail: 'jamie@example.com', childName: '  alex   PARENT ' })).consent
  assert.equal(mediaConsentSubjectKey(a), mediaConsentSubjectKey(b))
})

// ─── Storage / audit trail ────────────────────────────────────────────────

test('first submission stores the latest response with the consent text snapshot', async () => {
  const { db, store } = makeFakeDb()
  const saved = await submit(db, { choice: 'NO' })
  assert.equal(saved.revision, 1)
  const [doc] = docs(store)
  assert.equal(doc.isLatest, true)
  assert.equal(doc.mediaConsent, 'NO')
  assert.equal(doc.photoPermissionGranted, false)
  assert.equal(doc.parentEmail, 'jamie@example.com')
  assert.equal(doc.signature.typedName, 'Jamie Parent')
  assert.equal(doc.sessionLabel, 'Afternoon Workshop (2:00 PM–3:30 PM)')
  assert.equal(doc.consentVersion, MEDIA_CONSENT_VERSION)
  assert.match(doc.consentTextSnapshot.choice, /^NO — I do not give permission/)
})

test('a resubmission supersedes the earlier response but keeps it', async () => {
  const { db, store } = makeFakeDb()
  const first = await submit(db, { choice: 'YES' })
  const second = await submit(db, { choice: 'NO', clientRequestId: 'client-request-id-67890' })
  assert.equal(second.revision, 2)

  const all = docs(store)
  assert.equal(all.length, 2)
  const old = all.find(doc => doc.id === first.id)
  const latest = all.find(doc => doc.id === second.id)
  assert.equal(old.isLatest, false)
  assert.equal(old.supersededById, second.id)
  assert.equal(old.mediaConsent, 'YES')
  assert.equal(latest.isLatest, true)
  assert.deepEqual(latest.supersedesIds, [first.id])
  assert.equal(latest.mediaConsent, 'NO')
})

test('a retried request (same clientRequestId) does not create a second response', async () => {
  const { db, store } = makeFakeDb()
  const first = await submit(db)
  const retry = await submit(db)
  assert.equal(retry.duplicate, true)
  assert.equal(retry.id, first.id)
  assert.equal(store.size, 1)
})

test('a sibling under the same parent is a separate subject', async () => {
  const { db, store } = makeFakeDb()
  await submit(db)
  await submit(db, { childName: 'Sam Parent', clientRequestId: 'client-request-id-sibling' })
  const all = docs(store)
  assert.equal(all.length, 2)
  assert.ok(all.every(doc => doc.isLatest === true))
})

// ─── General (/consent) ───────────────────────────────────────────────────

test('general consent accepts an optional program name and no session', () => {
  const result = validateMediaConsentPayload(baseBody({ eventId: GENERAL_MEDIA_CONSENT_ID, sessionId: '', programName: '  Bricks  Challenge ' }))
  assert.equal(result.error, undefined)
  assert.equal(result.consent.programName, 'Bricks Challenge')
  assert.match(validateMediaConsentPayload(baseBody({ eventId: GENERAL_MEDIA_CONSENT_ID, sessionId: 'am' })).error, /session/)
})

test('program name is ignored for event consents', () => {
  assert.equal(validateMediaConsentPayload(baseBody({ programName: 'Camp' })).consent.programName, '')
})

test('general and event consent for the same child are separate subjects', async () => {
  const { db, store } = makeFakeDb()
  await submit(db)
  await submit(db, { eventId: GENERAL_MEDIA_CONSENT_ID, sessionId: '', programName: 'Camp', clientRequestId: 'client-request-id-general' })
  const all = docs(store)
  assert.equal(all.length, 2)
  assert.ok(all.every(doc => doc.isLatest === true))
  const general = all.find(doc => doc.eventId === GENERAL_MEDIA_CONSENT_ID)
  assert.equal(general.programName, 'Camp')
  assert.equal(general.sessionLabel, null)
  assert.equal(general.eventSnapshot.date, null)
})
