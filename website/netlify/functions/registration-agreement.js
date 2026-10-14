// Parent's digital learning-path agreement for a staff-created Builder or
// Engineer registration (page: /robotics/agreement?r=<registrationId>&t=<token>).
//
//   GET  ?r&t                   -> what the parent is agreeing to (no PII
//                                  beyond the child's first name)
//   POST { r, t, fullName, commitmentAccepted, termsAccepted, paymentOption }
//                               -> records the acceptance and the parent's
//                                  payment choice (Pay in Full or the monthly
//                                  plan) on the registration
//   POST { action: 'choosePlan', r, t, paymentOption }
//                               -> switches the payment choice after
//                                  acceptance, until a payment is recorded
//
// Choosing a payment option writes the payment schedule — one row per
// e-Transfer, due monthly from today — which staff mark received in the
// portal (registration-payment-schedule.js there).
// The portal (create-manual-registration / update-registration-payment) stores
// only the SHA-256 of the emailed token as `agreementTokenHash`; the link is
// the only credential. Acceptance is written once and never overwritten, and
// never changes registrationStatus — an admin activates the registration after
// recording the e-Transfer payment. The first acceptance emails the parent a
// copy and notifies staff (ADMIN_EMAIL).
import crypto from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'
import { RequestRejectedError, enforceRateLimit } from './submit-enrollment-request.js'
import { sendAgreementEmails } from './_lib/agreement-email.js'
import { buildPaymentSchedule, todayIso, withHst } from '../../lib/payment-schedule.js'
import {
  AGREEMENT_COMMITMENT_STATEMENT,
  AGREEMENT_TERMS_STATEMENT,
  ROBOTICS_TERMS_URL,
  ROBOTICS_TERMS_VERSION,
  validateAgreementSubmission,
} from '../../lib/robotics-agreement.js'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}
const MAX_BODY_BYTES = 4 * 1024
// Same address as the portal's e-Transfer instructions
// (portal: src/lib/registrationPayment.js) and this site's demo emails.
const ETRANSFER_EMAIL = process.env.NEXT_PUBLIC_ETRANSFER_EMAIL || 'info@krianatutoring.com'
// Portal paymentStatus values once a payment is in (Paid in Full, Partial Payment).
const PAYMENT_RECORDED = ['Paid', 'Payment Plan Active']

const INVALID_LINK = 'This agreement link is no longer valid. Please use the most recent email from Kriana Tutoring, or contact us.'

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) }
}

function tokenMatches(registration, token) {
  const stored = registration?.agreementTokenHash
  if (typeof stored !== 'string' || typeof token !== 'string' || !token) return false
  const given = crypto.createHash('sha256').update(token).digest('hex')
  return stored.length === given.length && crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(given))
}

function installmentsFor(pkg) {
  if (!pkg) return null
  return pkg.paymentPlanInstallments !== undefined ? pkg.paymentPlanInstallments : ({ builder: 2, engineer: 4 })[pkg.id] ?? null
}

/** The registration's own stored figures (a revision may have changed them),
 * falling back to its package snapshot. Amounts before tax. */
function paymentFigures(registration) {
  const pkg = registration.packageSnapshot || {}
  const totalCents = registration.programTotalCents ?? pkg.subtotalCents ?? (pkg.perClassCents ?? 0) * (pkg.classCount ?? 0)
  const installments = installmentsFor(pkg)
  const installmentCents = installments
    ? (registration.installmentCount === installments && registration.installmentAmountCents) || Math.round(totalCents / installments)
    : null
  return { totalCents, installments, installmentCents }
}

/** The payment options the parent may pick from: always Pay in Full, plus
 * the learning path's monthly plan. Amounts include HST. */
export function paymentChoices(registration) {
  const { totalCents, installments, installmentCents } = paymentFigures(registration)
  const choices = [{ value: 'pay_in_full', label: 'Pay in full', payments: 1, amountCents: withHst(totalCents) }]
  if (installments) {
    choices.push({ value: `plan_${installments}`, label: `${installments} monthly payments`, payments: installments, amountCents: withHst(installmentCents) })
  }
  return choices
}

/** The parent may pick or switch the option until any payment is recorded. */
export function canChoosePlan(registration) {
  if (registration.registrationStatus !== 'Pending Payment') return false
  if (PAYMENT_RECORDED.includes(registration.paymentStatus)) return false
  if ((registration.amountReceivedCents ?? 0) > 0) return false
  return !(registration.paymentSchedule || []).some(row => row.status === 'received')
}

/** Registration fields for the parent's payment choice, or null when it
 * can't change (a payment is already in, or it is already chosen). */
export function paymentChoiceUpdate(registration, paymentOption, today = todayIso()) {
  if (!canChoosePlan(registration)) return null
  const choice = paymentChoices(registration).find(item => item.value === paymentOption)
  if (!choice) return null
  if (registration.paymentOption === paymentOption && registration.paymentSchedule?.length === choice.payments
    && registration.paymentOptionChosenBy === 'parent') return null
  const { totalCents, installmentCents } = paymentFigures(registration)
  const schedule = buildPaymentSchedule({
    totalCents,
    count: choice.payments,
    installmentAmountCents: choice.payments > 1 ? installmentCents : null,
    firstDueDate: today,
  })
  return {
    paymentOption,
    paymentOptionChosenBy: 'parent',
    paymentOptionChosenAt: FieldValue.serverTimestamp(),
    paymentSchedule: schedule,
    programTotalCents: totalCents,
    installmentsPaid: 0,
    amountReceivedCents: 0,
    remainingBalanceCents: withHst(totalCents),
    nextPaymentDueDate: schedule[0].dueDate,
  }
}

/** What the page shows. e-Transfer instructions only once the agreement is accepted. */
export function agreementView(registration) {
  const pkg = registration.packageSnapshot || {}
  const accepted = registration.agreementAccepted === true
  const { totalCents: subtotalCents, installments, installmentCents } = paymentFigures(registration)
  const schedule = registration.paymentSchedule || []
  const nextRow = schedule.find(row => row.status !== 'received')
  return {
    childFirstName: String(registration.childName || '').trim().split(/\s+/)[0],
    programTitle: registration.programSnapshot?.title || '',
    registrationNumber: registration.registrationNumber || '',
    packageName: pkg.name || '',
    classCount: pkg.classCount ?? null,
    installments,
    accepted,
    acceptedBy: accepted ? registration.agreementAcceptedBy || '' : '',
    // Portal stored values for Paid in Full and Partial Payment (first
    // installment received) — see the portal's lib/registrationPayment.js.
    paymentRecorded: PAYMENT_RECORDED.includes(registration.paymentStatus),
    paymentChoices: paymentChoices(registration),
    paymentOption: registration.paymentOption || null,
    canChoosePlan: canChoosePlan(registration),
    // Due dates and amounts only — nothing about the family.
    schedule: accepted && schedule.length
      ? schedule.map(row => ({ number: row.number, dueDate: row.dueDate, totalCents: row.totalCents, received: row.status === 'received' }))
      : null,
    etransfer: accepted
      ? {
        sendTo: ETRANSFER_EMAIL,
        payInFullCents: withHst(subtotalCents),
        planPaymentCents: installments ? withHst(installmentCents) : null,
        // The amount to send next under the chosen option.
        nextPaymentCents: nextRow?.totalCents ?? null,
        // Child's first name and reference, e.g. "Vihaan — YE-2026-0026".
        message: [String(registration.childName || '').trim().split(/\s+/)[0], registration.registrationNumber].filter(Boolean).join(' — '),
      }
      : null,
  }
}

/** Loads a registration the link may act on, or null. */
function usable(snapshot, token) {
  if (!snapshot.exists) return null
  const registration = snapshot.data()
  if (registration.agreementRequired !== true) return null
  if (registration.registrationStatus === 'Cancelled') return null
  if (!tokenMatches(registration, token)) return null
  return registration
}

/** null for an unusable link; otherwise { view, registration, firstAcceptance }.
 * `paymentOption` is the parent's choice; it is required when there is more
 * than one and none can be kept (see paymentChoiceUpdate). */
export async function acceptAgreement(db, { registrationId, token, fullName, paymentOption = '', userAgent = '', today = todayIso() }) {
  const ref = db.collection('registrations').doc(registrationId)
  return db.runTransaction(async tx => {
    const registration = usable(await tx.get(ref), token)
    if (!registration) return null
    // Already accepted (double-tap, or opened again): keep the first record.
    if (registration.agreementAccepted === true) {
      return { view: agreementView(registration), registration, firstAcceptance: false }
    }
    const choice = paymentChoiceUpdate(registration, paymentOption, today)
    if (!choice && canChoosePlan(registration) && !registration.paymentOption && paymentChoices(registration).length > 1) {
      throw new RequestRejectedError(400, 'Please choose how you would like to pay.')
    }
    const acceptance = {
      ...(choice || {}),
      agreementAccepted: true,
      agreementAcceptedAt: FieldValue.serverTimestamp(),
      agreementAcceptedBy: fullName,
      termsVersion: ROBOTICS_TERMS_VERSION,
      // Exactly what the parent ticked, frozen with the acceptance.
      agreementTextSnapshot: {
        commitment: AGREEMENT_COMMITMENT_STATEMENT,
        terms: AGREEMENT_TERMS_STATEMENT,
        termsUrl: ROBOTICS_TERMS_URL,
      },
      agreementUserAgent: String(userAgent).slice(0, 300),
      updatedAt: FieldValue.serverTimestamp(),
    }
    tx.update(ref, acceptance)
    const accepted = { ...registration, ...acceptance }
    return { view: agreementView(accepted), registration: accepted, firstAcceptance: true }
  })
}

/** After acceptance: switch between Pay in Full and the monthly plan while
 * no payment is recorded. null for an unusable link. */
export async function choosePaymentPlan(db, { registrationId, token, paymentOption, today = todayIso() }) {
  const ref = db.collection('registrations').doc(registrationId)
  return db.runTransaction(async tx => {
    const registration = usable(await tx.get(ref), token)
    if (!registration) return null
    if (registration.agreementAccepted !== true) throw new RequestRejectedError(409, 'Please accept the agreement first.')
    if (!canChoosePlan(registration)) {
      throw new RequestRejectedError(409, 'A payment is already recorded, so the payment option can no longer change here. Please contact us.')
    }
    if (!paymentChoices(registration).some(item => item.value === paymentOption)) {
      throw new RequestRejectedError(400, 'Please choose how you would like to pay.')
    }
    const update = paymentChoiceUpdate(registration, paymentOption, today)
    if (!update) return { view: agreementView(registration), registration }
    tx.update(ref, { ...update, updatedAt: FieldValue.serverTimestamp() })
    const next = { ...registration, ...update }
    return { view: agreementView(next), registration: next }
  })
}

function validId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value)
}

export const handler = async event => {
  try {
    if (event.httpMethod === 'GET') {
      const { r, t } = event.queryStringParameters || {}
      if (!validId(r)) return json(404, { error: INVALID_LINK })
      const registration = usable(await getAdminDb().collection('registrations').doc(r).get(), t)
      return registration ? json(200, agreementView(registration)) : json(404, { error: INVALID_LINK })
    }

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: { ...JSON_HEADERS, Allow: 'GET, POST' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
    }
    if (!event.body || Buffer.byteLength(event.body, 'utf8') > MAX_BODY_BYTES) {
      return json(413, { error: 'Request body is empty or too large.' })
    }
    let body
    try {
      body = JSON.parse(event.body)
    } catch {
      return json(400, { error: 'Invalid JSON.' })
    }
    if (!validId(body.r)) return json(404, { error: INVALID_LINK })
    const paymentOption = typeof body.paymentOption === 'string' ? body.paymentOption.slice(0, 20) : ''

    if (body.action === 'choosePlan') {
      const db = getAdminDb()
      if (!await enforceRateLimit(db, event)) {
        return json(429, { error: 'Too many requests. Please wait a few minutes and try again.' })
      }
      const chosen = await choosePaymentPlan(db, { registrationId: body.r, token: body.t, paymentOption })
      return chosen ? json(200, chosen.view) : json(404, { error: INVALID_LINK })
    }

    const validated = validateAgreementSubmission(body)
    if (validated.error) return json(400, { error: validated.error })

    const db = getAdminDb()
    if (!await enforceRateLimit(db, event)) {
      return json(429, { error: 'Too many requests. Please wait a few minutes and try again.' })
    }
    const result = await acceptAgreement(db, {
      registrationId: body.r,
      token: body.t,
      fullName: validated.fullName,
      paymentOption,
      userAgent: event.headers?.['user-agent'],
    })
    if (!result) return json(404, { error: INVALID_LINK })
    if (result.firstAcceptance) {
      try {
        await sendAgreementEmails({ registration: result.registration, view: result.view })
      } catch (emailError) {
        console.error('Agreement emails failed:', emailError)
      }
    }
    return json(200, result.view)
  } catch (error) {
    if (error instanceof RequestRejectedError) return json(error.statusCode, { error: error.message })
    console.error('registration-agreement failed:', error)
    return json(500, { error: 'We could not save your agreement. Please try again or contact Kriana Tutoring.' })
  }
}
