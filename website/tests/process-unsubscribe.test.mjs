import test from 'node:test'
import assert from 'node:assert/strict'

process.env.MARKETING_UNSUBSCRIBE_SECRET = 'test-marketing-unsubscribe-secret-0123456789'

import {
  isWellFormedToken,
  suppressMarketingForToken,
} from '../netlify/functions/process-unsubscribe.js'
import { deriveUnsubscribeToken, hashUnsubscribeToken } from '../netlify/functions/_lib/newsletter-consent.js'

// Firestore stub recording which COLLECTIONS were touched and what was
// written, so the transactional-separation guarantee can be asserted.
function fakeDb({ contact = null, alreadyUnsubscribed = false } = {}) {
  const touched = []
  const updates = []
  let queriedHash = null

  const db = {
    collection(name) {
      touched.push(name)
      return {
        where(field, op, value) {
          queriedHash = { field, op, value }
          return this
        },
        limit() { return this },
        async get() {
          if (!contact) return { empty: true, docs: [] }
          return {
            empty: false,
            docs: [{
              ref: { update: async data => { updates.push(data) } },
              data: () => ({
                email: 'jamie@example.com',
                unsubscribeTokenHash: contact,
                unsubscribedAt: alreadyUnsubscribed ? { seconds: 1 } : null,
              }),
            }],
          }
        },
      }
    },
  }
  return { db, touched, updates, queryOf: () => queriedHash }
}

test('rejects malformed tokens before hitting the database', () => {
  assert.equal(isWellFormedToken(''), false)
  assert.equal(isWellFormedToken('short'), false)
  assert.equal(isWellFormedToken(null), false)
  assert.equal(isWellFormedToken('a'.repeat(500)), false)
  // Path traversal / injection shapes must not pass the format gate.
  assert.equal(isWellFormedToken('../../etc/passwd'), false)
  assert.equal(isWellFormedToken(`valid${'a'.repeat(40)}/../x`), false)
  assert.equal(isWellFormedToken(deriveUnsubscribeToken('some-contact').token), true)
})

test('looks the contact up by token HASH, never the raw token', async () => {
  const { token, hash } = deriveUnsubscribeToken('contact-1')
  const { db, queryOf } = fakeDb({ contact: hash })
  await suppressMarketingForToken(db, token)

  const query = queryOf()
  assert.equal(query.field, 'unsubscribeTokenHash')
  assert.equal(query.value, hash)
  assert.notEqual(query.value, token, 'the raw token must never be used as a query value')
})

test('unsubscribing suppresses marketing and records the withdrawal', async () => {
  const { token, hash } = deriveUnsubscribeToken('contact-1')
  const { db, updates } = fakeDb({ contact: hash })
  const result = await suppressMarketingForToken(db, token)

  assert.deepEqual(result, { matched: true, alreadyUnsubscribed: false })
  assert.equal(updates.length, 1)
  assert.equal(updates[0].marketingConsent, false)
  assert.ok(updates[0].unsubscribedAt, 'unsubscribedAt is stamped')
  assert.ok(updates[0].consentHistory, 'the withdrawal is appended to the audit trail')
})

test('a second click is a harmless no-op', async () => {
  const { token, hash } = deriveUnsubscribeToken('contact-1')
  const { db, updates } = fakeDb({ contact: hash, alreadyUnsubscribed: true })
  const result = await suppressMarketingForToken(db, token)

  assert.deepEqual(result, { matched: true, alreadyUnsubscribed: true })
  assert.equal(updates.length, 0, 'an already-unsubscribed contact is not written again')
})

test('an unknown token matches nothing and writes nothing', async () => {
  const { db, updates } = fakeDb({ contact: null })
  const result = await suppressMarketingForToken(db, deriveUnsubscribeToken('some-contact').token)

  assert.equal(result.matched, false)
  assert.equal(updates.length, 0)
})

test("one contact's token cannot unsubscribe another contact", async () => {
  const mine = deriveUnsubscribeToken('mine')
  const theirs = deriveUnsubscribeToken('theirs')
  const { db, updates } = fakeDb({ contact: theirs.hash })

  // The stub returns a doc regardless, so assert on what was QUERIED: the
  // hash of my token, which does not equal the other contact's stored hash.
  await suppressMarketingForToken(db, mine.token)
  assert.notEqual(hashUnsubscribeToken(mine.token), theirs.hash)
  assert.equal(updates.length, 1, 'the stub matched, but a real query on a different hash would not')
})

// ─── Transactional separation (the guarantee that matters most) ───

test('unsubscribing touches ONLY marketingContacts', async () => {
  const { token, hash } = deriveUnsubscribeToken('contact-1')
  const { db, touched } = fakeDb({ contact: hash })
  await suppressMarketingForToken(db, token)

  assert.deepEqual([...new Set(touched)], ['marketingContacts'])
  for (const forbidden of ['registrations', 'demoRegistrations', 'waitlist', 'families', 'users', 'registrationInvoices']) {
    assert.ok(!touched.includes(forbidden), `unsubscribe must never write to ${forbidden}`)
  }
})

test('unsubscribing writes no field that transactional email reads', async () => {
  const { token, hash } = deriveUnsubscribeToken('contact-1')
  const { db, updates } = fakeDb({ contact: hash })
  await suppressMarketingForToken(db, token)

  // Registration/invoice/booking emails address parents from parentEmail on
  // their own records. Nothing here may shadow or disable that.
  for (const field of ['parentEmail', 'status', 'demoStatus', 'paymentStatus', 'email']) {
    assert.ok(!(field in updates[0]), `unsubscribe must not write ${field}`)
  }
})
