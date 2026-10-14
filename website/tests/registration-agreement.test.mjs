import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import { acceptAgreement, agreementView, choosePaymentPlan } from '../netlify/functions/registration-agreement.js'
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
  const { view, firstAcceptance } = await acceptAgreement(db, { registrationId: 'reg1', token: TOKEN, fullName: 'Priya Sharma', paymentOption: 'plan_4', today: '2026-10-14' })
  assert.equal(firstAcceptance, true)
  assert.equal(view.accepted, true)
  assert.equal(store.data.agreementAccepted, true)
  assert.equal(store.data.agreementAcceptedBy, 'Priya Sharma')
  assert.equal(store.data.termsVersion, ROBOTICS_TERMS_VERSION)
  assert.ok(store.data.agreementAcceptedAt)
  assert.equal(store.data.registrationStatus, 'Pending Payment')
  assert.deepEqual(view.etransfer, {
    sendTo: 'info@krianatutoring.com', payInFullCents: 101700, planPaymentCents: 25425, nextPaymentCents: 25425, message: 'Vihaan — YE-2026-0026',
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
  const { view, registration: accepted } = await acceptAgreement(db, { registrationId: 'reg1', token: TOKEN, fullName: 'Priya Sharma', paymentOption: 'plan_4', today: '2026-10-14' })
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

test('the parent picks the payment option when accepting, which writes the schedule', async () => {
  const { db, store } = fakeDb(registration())
  await assert.rejects(
    acceptAgreement(db, { registrationId: 'reg1', token: TOKEN, fullName: 'Priya Sharma' }),
    /choose how you would like to pay/,
  )
  assert.equal(store.data.agreementAccepted, false)
  await assert.rejects(
    acceptAgreement(db, { registrationId: 'reg1', token: TOKEN, fullName: 'Priya Sharma', paymentOption: 'plan_6' }),
    /choose how you would like to pay/,
  )

  const { view } = await acceptAgreement(db, { registrationId: 'reg1', token: TOKEN, fullName: 'Priya Sharma', paymentOption: 'plan_4', today: '2026-10-14' })
  assert.equal(store.data.paymentOption, 'plan_4')
  assert.equal(store.data.paymentOptionChosenBy, 'parent')
  assert.deepEqual(store.data.paymentSchedule.map(row => row.dueDate), ['2026-10-14', '2026-11-14', '2026-12-14', '2027-01-14'])
  assert.equal(store.data.paymentSchedule.reduce((sum, row) => sum + row.totalCents, 0), 101700)
  assert.equal(store.data.nextPaymentDueDate, '2026-10-14')
  assert.equal(view.schedule.length, 4)
  assert.equal(view.canChoosePlan, true)
  assert.deepEqual(view.paymentChoices.map(choice => [choice.value, choice.amountCents]), [['pay_in_full', 101700], ['plan_4', 25425]])
})

test('after accepting, the parent can switch options until a payment is recorded', async () => {
  const { db, store } = fakeDb(registration())
  await acceptAgreement(db, { registrationId: 'reg1', token: TOKEN, fullName: 'Priya Sharma', paymentOption: 'plan_4', today: '2026-10-14' })
  const { view } = await choosePaymentPlan(db, { registrationId: 'reg1', token: TOKEN, paymentOption: 'pay_in_full', today: '2026-10-15' })
  assert.equal(store.data.paymentOption, 'pay_in_full')
  assert.equal(store.data.paymentSchedule.length, 1)
  assert.equal(view.etransfer.nextPaymentCents, 101700)
  assert.equal(await choosePaymentPlan(db, { registrationId: 'reg1', token: 'wrong', paymentOption: 'plan_4' }), null)

  store.data.paymentSchedule = [{ ...store.data.paymentSchedule[0], status: 'received' }]
  await assert.rejects(
    choosePaymentPlan(db, { registrationId: 'reg1', token: TOKEN, paymentOption: 'plan_4' }),
    /already recorded/,
  )
})

test('a revised installment amount is what the parent is offered', () => {
  const view = agreementView(registration({ programTotalCents: 50000, installmentCount: 4, installmentAmountCents: 12000 }))
  assert.deepEqual(view.paymentChoices.map(choice => choice.amountCents), [56500, 13560])
})

test('the agreement emails show the chosen option and the schedule', async () => {
  const { parentAgreementEmail, adminAgreementEmail } = await import('../netlify/functions/_lib/agreement-email.js')
  const { db } = fakeDb(registration({ parentName: 'Priya Sharma' }))
  const { view, registration: accepted } = await acceptAgreement(db, { registrationId: 'reg1', token: TOKEN, fullName: 'Priya Sharma', paymentOption: 'plan_4', today: '2026-10-14' })
  const parent = parentAgreementEmail({ registration: accepted, view, acceptedAtLabel: 'x' })
  assert.match(parent.html, /Payment option<\/td><td[^>]*>4 monthly payments/)
  assert.match(parent.html, /Payment 4<\/td><td[^>]*>\$254\.25 <span[^>]*>due January 14, 2027/)
  assert.match(adminAgreementEmail({ registration: accepted, view, acceptedAtLabel: 'x' }).html, /4 monthly payments/)
})
