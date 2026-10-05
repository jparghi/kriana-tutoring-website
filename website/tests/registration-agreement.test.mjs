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
    packageSnapshot: { id: 'engineer', name: 'Engineer', classCount: 36, perClassCents: 2500, subtotalCents: 90000, paymentPlanInstallments: 4 },
    agreementRequired: true, agreementAccepted: false, agreementTokenHash: hash,
    ...overrides,
  }
}

test('accepting records who, when, which terms version — once', async () => {
  const { db, store } = fakeDb(registration())
  const { view, firstAcceptance } = await acceptAgreement(db, { registrationId: 'reg1', token: TOKEN, fullName: 'Priya Sharma' })
  assert.equal(firstAcceptance, true)
  assert.equal(view.accepted, true)
  assert.equal(store.data.agreementAccepted, true)
  assert.equal(store.data.agreementAcceptedBy, 'Priya Sharma')
  assert.equal(store.data.termsVersion, ROBOTICS_TERMS_VERSION)
  assert.ok(store.data.agreementAcceptedAt)
  assert.equal(store.data.registrationStatus, 'Pending Payment')
  assert.deepEqual(view.etransfer, {
    sendTo: 'info@krianatutoring.com', payInFullCents: 101700, planPaymentCents: 25425, message: 'Vihaan — YE-2026-0026',
  })

  const again = await acceptAgreement(db, { registrationId: 'reg1', token: TOKEN, fullName: 'Someone Else' })
  assert.equal(again.firstAcceptance, false)
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

test('agreement emails: parent copy and a separate staff notice', async () => {
  const { parentAgreementEmail, adminAgreementEmail } = await import('../netlify/functions/_lib/agreement-email.js')
  const { db } = fakeDb(registration({ parentName: 'Priya Sharma' }))
  const { view, registration: accepted } = await acceptAgreement(db, { registrationId: 'reg1', token: TOKEN, fullName: 'Priya Sharma' })
  const acceptedAtLabel = 'October 7, 2026 at 3:12 p.m.'

  const parent = parentAgreementEmail({ registration: accepted, view, acceptedAtLabel })
  assert.equal(parent.subject, "Agreement Received — Vihaan's Bricks Challenge Engineer Learning Path")
  assert.match(parent.html, /Hi Priya,/)
  assert.match(parent.html, /Accepted by<\/td><td[^>]*>Priya Sharma/)
  assert.match(parent.html, /October 7, 2026 at 3:12 p\.m\./)
  assert.match(parent.html, /full program commitment/)
  assert.match(parent.html, /\$254\.25/)

  const admin = adminAgreementEmail({ registration: accepted, view, acceptedAtLabel })
  assert.equal(admin.subject, 'Agreement accepted — Vihaan Sharma · YE-2026-0026')
  assert.match(admin.html, /p@example\.com/)
  assert.match(admin.html, /Payment is not recorded yet/)
  assert.match(admin.html, /portal\.krianatutoring\.com\/tutor\/booking\/registrations/)
})
