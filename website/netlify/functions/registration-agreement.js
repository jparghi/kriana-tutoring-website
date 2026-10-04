// Parent's digital learning-path agreement for a staff-created Builder or
// Engineer registration (page: /robotics/agreement?r=<registrationId>&t=<token>).
//
//   GET  ?r&t                   -> what the parent is agreeing to (no PII
//                                  beyond the child's first name)
//   POST { r, t, fullName, commitmentAccepted, termsAccepted }
//                               -> records the acceptance on the registration
//
// The portal (create-manual-registration / update-registration-payment) stores
// only the SHA-256 of the emailed token as `agreementTokenHash`; the link is
// the only credential. Acceptance is written once and never overwritten, and
// never changes registrationStatus — an admin activates the registration after
// recording the e-Transfer payment.
import crypto from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'
import { RequestRejectedError, enforceRateLimit } from './submit-enrollment-request.js'
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
// Same address and HST rate as the portal's e-Transfer instructions
// (portal: src/lib/registrationPayment.js) and this site's demo emails.
const ETRANSFER_EMAIL = process.env.NEXT_PUBLIC_ETRANSFER_EMAIL || 'info@krianatutoring.com'
const HST_RATE = 0.13
const withHst = cents => cents + Math.round(cents * HST_RATE)

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

/** What the page shows. e-Transfer instructions only once the agreement is accepted. */
export function agreementView(registration) {
  const pkg = registration.packageSnapshot || {}
  const accepted = registration.agreementAccepted === true
  const installments = installmentsFor(pkg)
  const subtotalCents = pkg.subtotalCents ?? (pkg.perClassCents ?? 0) * (pkg.classCount ?? 0)
  return {
    childFirstName: String(registration.childName || '').trim().split(/\s+/)[0],
    programTitle: registration.programSnapshot?.title || '',
    registrationNumber: registration.registrationNumber || '',
    packageName: pkg.name || '',
    classCount: pkg.classCount ?? null,
    installments,
    accepted,
    acceptedBy: accepted ? registration.agreementAcceptedBy || '' : '',
    paymentRecorded: ['Paid', 'Payment Plan Active'].includes(registration.paymentStatus),
    etransfer: accepted
      ? {
        sendTo: ETRANSFER_EMAIL,
        payInFullCents: withHst(subtotalCents),
        planPaymentCents: installments ? withHst(Math.round(subtotalCents / installments)) : null,
        message: [registration.programSnapshot?.title, registration.registrationNumber].filter(Boolean).join(' - '),
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

export async function acceptAgreement(db, { registrationId, token, fullName, userAgent = '' }) {
  const ref = db.collection('registrations').doc(registrationId)
  return db.runTransaction(async tx => {
    const registration = usable(await tx.get(ref), token)
    if (!registration) return null
    // Already accepted (double-tap, or opened again): keep the first record.
    if (registration.agreementAccepted === true) return agreementView(registration)
    const acceptance = {
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
    return agreementView({ ...registration, ...acceptance })
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
    const validated = validateAgreementSubmission(body)
    if (validated.error) return json(400, { error: validated.error })

    const db = getAdminDb()
    if (!await enforceRateLimit(db, event)) {
      return json(429, { error: 'Too many requests. Please wait a few minutes and try again.' })
    }
    const view = await acceptAgreement(db, {
      registrationId: body.r,
      token: body.t,
      fullName: validated.fullName,
      userAgent: event.headers?.['user-agent'],
    })
    return view ? json(200, view) : json(404, { error: INVALID_LINK })
  } catch (error) {
    if (error instanceof RequestRejectedError) return json(error.statusCode, { error: error.message })
    console.error('registration-agreement failed:', error)
    return json(500, { error: 'We could not save your agreement. Please try again or contact Kriana Tutoring.' })
  }
}
