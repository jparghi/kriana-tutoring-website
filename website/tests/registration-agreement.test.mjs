import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import { acceptAgreement, agreementView } from '../netlify/functions/registration-agreement.js'
import { ROBOTICS_TERMS_VERSION, validateAgreementSubmission } from '../lib/robotics-agreement.js'

const TOKEN = 'secret-token'
const hash = crypto.createHash('sha256').update(TOKEN).digest('hex')

function fakeDb(doc) {
  const store = { data: doc }
  const db = {
    collection: () => ({ doc: id => ({ id }) }),
    runTransaction: fn => fn({
      get: async () => ({ exists: Boolean(store.data), data: () => store.data }),
      update: (_ref, fields) => { store.data = { ...store.data, ...fields } },
    }),
  }
  return { db, store }
}

function registration(overrides = {}) {
  return {
    registrationNumber: 'YE-2026-0026', childName: 'Vihaan Sharma', parentEmail: 'p@example.com',
    registrationStatus: 'Pending Payment', paymentStatus: 'Pending',
    programSnapshot: { title: 'Bricks Challenge' },
    packageSnapshot: { id: 'engineer', name: 'Engineer', classCount: 36, perClassCents: 2500, subtotalCents: 90000, paymentPlanInstallments: 6 },
    agreementRequired: true, agreementAccepted: false, agreementTokenHash: hash,
    ...overrides,
  }
}

test('accepting records who, when, which terms version — once', async () => {
  const { db, store } = fakeDb(registration())
  const view = await acceptAgreement(db, { registrationId: 'reg1', token: TOKEN, fullName: 'Priya Sharma' })
  assert.equal(view.accepted, true)
  assert.equal(store.data.agreementAccepted, true)
  assert.equal(store.data.agreementAcceptedBy, 'Priya Sharma')
  assert.equal(store.data.termsVersion, ROBOTICS_TERMS_VERSION)
  assert.ok(store.data.agreementAcceptedAt)
  assert.equal(store.data.registrationStatus, 'Pending Payment')
  assert.deepEqual(view.etransfer, {
    sendTo: 'info@krianatutoring.com', payInFullCents: 101700, planPaymentCents: 16950, message: 'Bricks Challenge - YE-2026-0026',
  })

  await acceptAgreement(db, { registrationId: 'reg1', token: TOKEN, fullName: 'Someone Else' })
  assert.equal(store.data.agreementAcceptedBy, 'Priya Sharma')
})

test('a wrong token, a cancelled or a Regular registration is refused', async () => {
  const cases = [
    [registration(), 'wrong'],
    [registration({ registrationStatus: 'Cancelled' }), TOKEN],
    [registration({ agreementRequired: false }), TOKEN],
  ]
  for (const [doc, token] of cases) {
    const { db, store } = fakeDb(doc)
    assert.equal(await acceptAgreement(db, { registrationId: 'reg1', token, fullName: 'Priya Sharma' }), null)
    assert.equal(store.data.agreementAccepted, false)
  }
})

test('payment details and parent contact are not exposed before acceptance', () => {
  const view = agreementView(registration())
  assert.equal(view.etransfer, null)
  assert.equal(view.childFirstName, 'Vihaan')
  assert.equal(JSON.stringify(view).includes('p@example.com'), false)
})

test('submission needs a full name and both boxes', () => {
  assert.ok(validateAgreementSubmission({ fullName: 'Priya', commitmentAccepted: true, termsAccepted: true }).error)
  assert.ok(validateAgreementSubmission({ fullName: 'Priya Sharma', commitmentAccepted: true, termsAccepted: false }).error)
  assert.deepEqual(validateAgreementSubmission({ fullName: '  Priya   Sharma ', commitmentAccepted: true, termsAccepted: true }), { fullName: 'Priya Sharma' })
})
