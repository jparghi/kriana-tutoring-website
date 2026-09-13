import test from 'node:test'
import assert from 'node:assert/strict'

process.env.MARKETING_UNSUBSCRIBE_SECRET = 'test-marketing-unsubscribe-secret-0123456789'

import {
  NEWSLETTER_CONSENT_TEXT,
  contactId,
  deriveUnsubscribeToken,
  hashUnsubscribeToken,
  interestFlags,
  normalizeEmail,
  signupIdempotencyDigest,
  validateSignupPayload,
} from '../netlify/functions/_lib/newsletter-consent.js'
import { saveNewsletterContact } from '../netlify/functions/submit-newsletter-signup.js'

function basePayload(overrides = {}) {
  return {
    clientRequestId: 'client-request-id-12345',
    parentName: 'Jamie Parent',
    email: 'Jamie@Example.com',
    interest: 'both',
    marketingConsent: true,
    ...overrides,
  }
}

// ─── Validation ───

test('accepts a well-formed consented signup and normalizes the email', () => {
  const result = validateSignupPayload(basePayload())
  assert.equal(result.error, undefined)
  assert.equal(result.email, 'jamie@example.com')
  assert.equal(result.emailDisplay, 'Jamie@Example.com')
  assert.equal(result.parentName, 'Jamie Parent')
  assert.equal(result.interest, 'both')
})

test('rejects an invalid email format', () => {
  for (const email of ['not-an-email', 'a@b', 'a b@example.com', '']) {
    const result = validateSignupPayload(basePayload({ email }))
    assert.equal(result.error, 'Please enter a valid email address.', `expected rejection for ${email}`)
  }
})

test('rejects a signup without marketing consent', () => {
  assert.equal(
    validateSignupPayload(basePayload({ marketingConsent: false })).error,
    'Please check the consent box to subscribe.',
  )
  // A missing field must fail closed exactly like an explicit false.
  const payload = basePayload()
  delete payload.marketingConsent
  assert.equal(validateSignupPayload(payload).error, 'Please check the consent box to subscribe.')
})

test('rejects a consent value that is truthy but not boolean true', () => {
  // Guards against `marketingConsent: "false"` or `1` sneaking through.
  assert.equal(validateSignupPayload(basePayload({ marketingConsent: 'true' })).error,
    'Please check the consent box to subscribe.')
})

test('rejects an unknown interest and a missing name', () => {
  assert.equal(validateSignupPayload(basePayload({ interest: 'chess' })).error,
    'Please choose what you are interested in.')
  assert.equal(validateSignupPayload(basePayload({ parentName: 'J' })).error,
    'Please enter the parent or guardian name.')
})

// ─── Identity and tokens ───

test('contact id is stable per normalized email, so a re-signup is an upsert', () => {
  assert.equal(contactId(normalizeEmail('Jamie@Example.com')), contactId(normalizeEmail('  jamie@example.com ')))
  assert.notEqual(contactId('jamie@example.com'), contactId('other@example.com'))
})

test('plus-addressed and dotted addresses stay distinct contacts', () => {
  assert.notEqual(contactId(normalizeEmail('a+one@example.com')), contactId(normalizeEmail('a@example.com')))
})

test('idempotency digest is namespaced per email and request id', () => {
  const a = signupIdempotencyDigest('jamie@example.com', 'req-1')
  assert.notEqual(a, signupIdempotencyDigest('jamie@example.com', 'req-2'))
  assert.notEqual(a, signupIdempotencyDigest('other@example.com', 'req-1'))
})

test('unsubscribe tokens are per-contact and only their hash is persistable', () => {
  const a = deriveUnsubscribeToken('contact-a')
  const b = deriveUnsubscribeToken('contact-b')
  assert.notEqual(a.token, b.token, "one contact's token must not unsubscribe another")
  assert.equal(a.hash, hashUnsubscribeToken(a.token))
  assert.notEqual(a.hash, a.token)
  assert.ok(a.token.length >= 40)
})

test('the same contact always derives the same token, so delivered links keep working', () => {
  assert.equal(deriveUnsubscribeToken('contact-a').token, deriveUnsubscribeToken('contact-a').token)
})

test('token derivation fails closed without a configured secret', () => {
  const saved = process.env.MARKETING_UNSUBSCRIBE_SECRET
  try {
    delete process.env.MARKETING_UNSUBSCRIBE_SECRET
    assert.throws(() => deriveUnsubscribeToken('contact-a'), /MARKETING_UNSUBSCRIBE_SECRET/)
    process.env.MARKETING_UNSUBSCRIBE_SECRET = 'too-short'
    assert.throws(() => deriveUnsubscribeToken('contact-a'), /MARKETING_UNSUBSCRIBE_SECRET/)
  } finally {
    process.env.MARKETING_UNSUBSCRIBE_SECRET = saved
  }
})

test('interest flags map to the segment booleans', () => {
  assert.deepEqual(interestFlags('tutoring'), { tutoring: true, robotics: false })
  assert.deepEqual(interestFlags('robotics'), { tutoring: false, robotics: true })
  assert.deepEqual(interestFlags('both'), { tutoring: true, robotics: true })
})

// ─── Upsert transaction ───
//
// Minimal Firestore transaction stub: records the writes so we can assert on
// them without an emulator, matching how the demo-waitlist tests fake `doc`.

function fakeDb(existingContact = null, existingKey = false) {
  const writes = []
  const docRef = name => ({ id: `${name}-id`, __name: name })
  const db = {
    collection: name => ({ doc: () => docRef(name) }),
    runTransaction: async fn => fn({
      get: async ref => {
        if (ref.__name === 'newsletterRequestKeys') {
          return { exists: existingKey, data: () => ({}) }
        }
        return { exists: Boolean(existingContact), data: () => existingContact }
      },
      create: (ref, data) => writes.push({ op: 'create', ref: ref.__name, data }),
      set: (ref, data) => writes.push({ op: 'set', ref: ref.__name, data }),
      update: (ref, data) => writes.push({ op: 'update', ref: ref.__name, data }),
    }),
  }
  return { db, writes }
}

test('a new signup creates the contact with a full consent record', async () => {
  const { db, writes } = fakeDb()
  const request = validateSignupPayload(basePayload())
  const result = await saveNewsletterContact(db, request)

  assert.equal(result.duplicate, false)
  assert.equal(result.alreadySubscribed, false)
  assert.ok(result.unsubscribeToken, 'a new contact gets a usable token for the welcome email')

  const created = writes.find(w => w.op === 'create' && w.ref === 'marketingContacts')
  assert.ok(created, 'contact document created')
  assert.equal(created.data.marketingConsent, true)
  assert.equal(created.data.marketingConsentText, NEWSLETTER_CONSENT_TEXT)
  assert.equal(created.data.marketingConsentSource, 'website-newsletter')
  assert.equal(created.data.unsubscribedAt, null)
  assert.equal(created.data.status, 'lead')
  assert.equal(created.data.consentHistory.length, 1)
  assert.equal(created.data.consentHistory[0].text, NEWSLETTER_CONSENT_TEXT)
  // The raw token must never be stored.
  assert.equal(created.data.unsubscribeTokenHash, hashUnsubscribeToken(result.unsubscribeToken))
  assert.ok(!JSON.stringify(created.data).includes(result.unsubscribeToken))
})

test('a replayed request writes nothing and reports duplicate', async () => {
  const { db, writes } = fakeDb(null, true)
  const result = await saveNewsletterContact(db, validateSignupPayload(basePayload()))
  assert.equal(result.duplicate, true)
  assert.equal(writes.length, 0, 'a replay must not write')
})

test('re-signup updates the existing contact instead of creating a second one', async () => {
  const { db, writes } = fakeDb({
    emailDisplay: 'jamie@example.com',
    firstName: 'Jamie',
    interests: { tutoring: true, robotics: false },
    marketingConsent: true,
    unsubscribedAt: null,
    unsubscribeTokenHash: 'existing-hash',
    consentHistory: [{ consent: true }],
  })
  const request = validateSignupPayload(basePayload({ interest: 'robotics' }))
  const result = await saveNewsletterContact(db, request)

  assert.equal(result.alreadySubscribed, true, 'no second welcome email for an existing subscriber')
  assert.equal(writes.filter(w => w.op === 'create').length, 0, 'must not create a duplicate contact')

  const updated = writes.find(w => w.op === 'update' && w.ref === 'marketingContacts')
  assert.ok(updated)
  // Interests are unioned, not replaced.
  assert.deepEqual(updated.data.interests, { tutoring: true, robotics: true })
  // Derivation is deterministic, so the stored hash is the contact's own.
  assert.equal(updated.data.unsubscribeTokenHash, deriveUnsubscribeToken('marketingContacts-id').hash)
})

test('an explicit consented re-signup clears a previous unsubscribe', async () => {
  const { db, writes } = fakeDb({
    emailDisplay: 'jamie@example.com',
    firstName: 'Jamie',
    interests: { tutoring: true, robotics: false },
    marketingConsent: false,
    unsubscribedAt: { seconds: 1 },
    unsubscribeTokenHash: 'existing-hash',
    consentHistory: [{ consent: true }, { consent: false }],
  })
  const result = await saveNewsletterContact(db, validateSignupPayload(basePayload()))

  const updated = writes.find(w => w.op === 'update' && w.ref === 'marketingContacts')
  assert.equal(updated.data.unsubscribedAt, null)
  assert.equal(updated.data.marketingConsent, true)
  assert.equal(result.alreadySubscribed, false, 'a returning unsubscriber is a fresh subscription')
})
