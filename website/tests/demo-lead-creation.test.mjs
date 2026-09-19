import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createLeadFromRegistration,
  logLeadActivity,
  normalizeLeadSource,
  buildLeadDoc,
} from '../netlify/functions/_lib/demo-lead.js'

// Minimal fake Firestore: batch.create fails the whole commit with
// ALREADY_EXISTS (gRPC code 6) when the doc exists, like the real thing.
function makeFakeDb({ failCommit = false } = {}) {
  const store = new Map()
  const ref = (collection, id) => ({ path: `${collection}/${id}`, async get() { return { exists: store.has(this.path) } } })
  return {
    _store: store,
    collection: name => ({ doc: id => ref(name, id) }),
    batch() {
      const ops = []
      return {
        create: (r, data) => ops.push(['create', r, data]),
        set: (r, data) => ops.push(['set', r, data]),
        update: (r, data) => ops.push(['update', r, data]),
        async commit() {
          if (failCommit) throw new Error('firestore unavailable')
          for (const [op, r] of ops) {
            if (op === 'create' && store.has(r.path)) {
              const error = new Error('6 ALREADY_EXISTS')
              error.code = 6
              throw error
            }
          }
          for (const [op, r, data] of ops) {
            store.set(r.path, op === 'update' ? { ...store.get(r.path), ...data } : data)
          }
        },
      }
    },
  }
}

function request(overrides = {}) {
  return {
    programId: 'prog-1',
    demoOfferingId: 'off-1',
    registration: { parentName: 'Sarah Mitchell', parentEmail: 'sarah@example.com', parentPhone: '6135551234', childName: 'Jacob', childAge: 8 },
    marketingAttribution: { landingPath: '/demo', source: 'facebook', medium: 'paid', campaign: 'oct-demo', content: null, term: null, referrer: null },
    ...overrides,
  }
}

const leads = db => [...db._store.keys()].filter(k => k.startsWith('demoLeads/'))
const activities = db => [...db._store.entries()].filter(([k]) => k.startsWith('demoLeadActivities/')).map(([, v]) => v)

test('a registration creates exactly one lead, keyed by the registration id, with a timeline entry', async () => {
  const db = makeFakeDb()
  const result = await createLeadFromRegistration(db, { registrationId: 'reg-1', reference: 'DEMO-2026-0001', request: request(), program: { title: 'Bricks' }, offering: { eventTitle: 'PD Day STEM Workshop' } })
  assert.equal(result.created, true)
  assert.deepEqual(leads(db), ['demoLeads/reg-1'])
  const lead = db._store.get('demoLeads/reg-1')
  assert.equal(lead.leadStatus, 'NEW')
  assert.equal(lead.leadSource, 'Facebook')
  assert.equal(lead.campaign, 'oct-demo')
  assert.equal(lead.parentEmail, 'sarah@example.com')
  assert.equal(lead.eventTitle, 'PD Day STEM Workshop')
  assert.equal(lead.newsletterCandidate, false)
  assert.equal(activities(db).length, 1)
  assert.equal(activities(db)[0].type, 'REGISTRATION_RECEIVED')
})

test('a retried/duplicate request does not create a second lead or a second activity', async () => {
  const db = makeFakeDb()
  const args = { registrationId: 'reg-1', reference: 'DEMO-2026-0001', request: request() }
  await createLeadFromRegistration(db, args)
  const again = await createLeadFromRegistration(db, args)
  assert.equal(again.created, false)
  assert.equal(leads(db).length, 1)
  assert.equal(activities(db).length, 1)
})

test('a lead failure never throws — the saved registration is unaffected', async () => {
  const db = makeFakeDb({ failCommit: true })
  const originalError = console.error
  console.error = () => {}
  try {
    const result = await createLeadFromRegistration(db, { registrationId: 'reg-1', reference: 'R', request: request() })
    assert.equal(result.created, false)
    assert.equal(result.error, true)
  } finally {
    console.error = originalError
  }
})

test('missing optional data: no phone, no attribution -> Unknown source, still a valid lead', async () => {
  const db = makeFakeDb()
  await createLeadFromRegistration(db, {
    registrationId: 'reg-2', reference: 'R2',
    request: request({ registration: { parentName: 'A B', parentEmail: 'a@b.co', parentPhone: '', childName: 'C', childAge: 5 }, marketingAttribution: undefined }),
  })
  const lead = db._store.get('demoLeads/reg-2')
  assert.equal(lead.parentPhone, null)
  assert.equal(lead.leadSource, 'Unknown')
  assert.equal(lead.campaign, null)
})

test('logLeadActivity appends to an existing lead and is a no-op without one', async () => {
  const db = makeFakeDb()
  await logLeadActivity(db, { registrationId: 'nope', type: 'ACK_EMAIL_SENT', description: 'x' })
  assert.equal(activities(db).length, 0)
  await createLeadFromRegistration(db, { registrationId: 'reg-1', reference: 'R', request: request() })
  await logLeadActivity(db, { registrationId: 'reg-1', type: 'ACK_EMAIL_SENT', description: 'sent' })
  assert.equal(activities(db).length, 2)
})

test('source normalization matches the portal copy for the common cases', () => {
  assert.equal(normalizeLeadSource({ source: 'facebook' }), 'Facebook')
  assert.equal(normalizeLeadSource({ source: 'ig' }), 'Instagram')
  assert.equal(normalizeLeadSource({ source: 'whatsapp' }), 'WhatsApp')
  assert.equal(normalizeLeadSource({ referrer: 'https://www.google.com' }), 'Google')
  assert.equal(normalizeLeadSource({ landingPath: '/demo' }), 'Direct')
  assert.equal(normalizeLeadSource(null), 'Unknown')
  assert.equal(buildLeadDoc({ registrationId: 'x', parentName: 'a', parentEmail: 'b', childName: 'c' }).leadSource, 'Unknown')
})
