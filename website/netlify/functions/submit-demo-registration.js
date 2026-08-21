// $10 Young Engineers Demo Registration — public submission endpoint.
//
// This is a NEW, entirely separate payment-collecting product from the
// existing Explorer/Builder/Engineer package flow (submit-enrollment-request.js)
// and the existing request_only (no-payment) enrollment-request flow. It must
// never weaken or reuse the state machine of either of those flows. It DOES
// reuse enforceRateLimit and RequestRejectedError from
// submit-enrollment-request.js, by explicit design (see the task brief) —
// nothing else about that file's behavior is touched.
//
// Fail-closed gate: this endpoint only operates when ENABLE_DEMO_PAYMENTS
// === 'true'. An absent, misspelled, or falsy value always serves a 503
// before any other work happens — mirroring the BOOKING_FLOW_MODE
// fail-closed philosophy in lib/booking-flow.ts.
//
// Payment is collected via e-transfer, confirmed manually by staff in the
// platform repo's admin app (see manage-demo-registration.js /
// _lib/demo-lifecycle.js's confirmDemoEtransferPayment) — not via Stripe.
// create-demo-payment-session.js and demo-payment-webhook.js are unused
// dead code from an earlier Stripe-based delivery, kept in case Stripe is
// reintroduced for this product later.
import crypto from 'node:crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'
import { RequestRejectedError, enforceRateLimit } from './submit-enrollment-request.js'
import { getDemoPricing } from '../../lib/robotics-packages.js'
import { DEMO_ELIGIBLE_PROGRAM_IDS, isDemoEligibleProgramId } from '../../lib/demo-eligibility.js'
import { computeChildEligibilityKeyHash } from '../../lib/demo-eligibility-crypto.js'
import { sendDemoAcknowledgement } from './_lib/demo-email.js'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}
const MAX_BODY_BYTES = 20 * 1024
const OFFERING_ACTIVE_STATUSES = new Set(['Open', 'Full'])
const DEMO_CONSENT_VERSION = 'demo-registration-v1'

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) }
}

function demoPaymentsEnabled() {
  return process.env.ENABLE_DEMO_PAYMENTS === 'true'
}

function normalizeText(value, maxLength) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

// ─── Marketing attribution (for the /demo campaign funnel) ────────────────
//
// Never trust the shape of the client object — it always comes back with
// every field present (possibly null), never throws, and a missing/invalid
// value must never block registration. The `ref` query param (used for
// flyer/QR links) is folded into `source` client-side before this function
// ever sees it, so the stored shape matches the story's schema exactly.

const ATTRIBUTION_FIELD_MAX = 80
const ALLOWED_ATTRIBUTION_KEYS = ['source', 'medium', 'campaign', 'content', 'term']

export function sanitizeAttribution(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { landingPath: null, source: null, medium: null, campaign: null, content: null, term: null, referrer: null }
  }

  const out = { landingPath: raw.landingPath === '/demo' ? '/demo' : null }
  for (const key of ALLOWED_ATTRIBUTION_KEYS) {
    const value = raw[key]
    out[key] = typeof value === 'string' && value.trim() ? normalizeText(value, ATTRIBUTION_FIELD_MAX) : null
  }

  if (typeof raw.referrer === 'string' && raw.referrer) {
    try {
      const url = new URL(raw.referrer)
      out.referrer = `${url.protocol}//${url.host}`.slice(0, 200)
    } catch {
      out.referrer = null
    }
  } else {
    out.referrer = null
  }

  return out
}

// ─── Payload validation (5-field spec only — no medical notes, no grade, no
// emergency contact, no photo consent) ───────────────────────────────────

export function validatePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Invalid request body.' }
  }

  const programId = normalizeText(body.programId, 150)
  const demoOfferingId = normalizeText(body.demoOfferingId, 150)
  const clientRequestId = normalizeText(body.clientRequestId, 100)
  const input = body.registration

  if (!programId || !demoOfferingId || !input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'Program, demo class schedule, and registration details are required.' }
  }
  if (programId.includes('/') || demoOfferingId.includes('/')) {
    return { error: 'Program or demo class schedule reference is invalid.' }
  }
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(clientRequestId)) {
    return { error: 'Request identifier is invalid.' }
  }

  const registration = {
    parentName: normalizeText(input.parentName, 120),
    parentEmail: normalizeText(input.parentEmail, 254).toLowerCase(),
    parentPhone: normalizeText(input.parentPhone, 40),
    childName: normalizeText(input.childName, 120),
    childAge: Number(String(input.childAge).trim()),
    consentAccepted: input.consentAccepted === true,
  }

  if (registration.parentName.length < 2) return { error: 'Please enter the parent or guardian name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.parentEmail)) return { error: 'Please enter a valid email address.' }
  if (registration.parentPhone.replace(/\D/g, '').length < 7) return { error: 'Please enter a valid phone number.' }
  if (registration.childName.length < 2) return { error: "Please enter the child's name." }
  if (!Number.isInteger(registration.childAge) || registration.childAge < 1 || registration.childAge > 18) {
    return { error: "Please enter the child's age between 1 and 18." }
  }
  if (!registration.consentAccepted) return { error: 'Consent is required before submitting.' }

  const marketingAttribution = sanitizeAttribution(body.marketingAttribution)

  return { programId, demoOfferingId, clientRequestId, registration, marketingAttribution }
}

// ─── Capacity / window helpers (same safety math as submit-enrollment-request.js) ───

function availableSeats(offering) {
  const capacity = Number(offering.capacity ?? 0)
  const confirmed = Number(offering.confirmedCount ?? 0)
  const held = Number(offering.heldCount ?? 0)
  if (
    !Number.isSafeInteger(capacity)
    || capacity <= 0
    || !Number.isSafeInteger(confirmed)
    || confirmed < 0
    || !Number.isSafeInteger(held)
    || held < 0
    || confirmed + held > capacity
  ) return null
  return capacity - confirmed - held
}

function timestampMillis(value) {
  if (!value) return null
  if (typeof value.toMillis === 'function') {
    const millis = value.toMillis()
    return Number.isFinite(millis) ? millis : Number.NaN
  }
  const millis = new Date(value).getTime()
  return Number.isFinite(millis) ? millis : Number.NaN
}

function registrationWindowIsOpen(offering) {
  const now = Date.now()
  const opensAt = timestampMillis(offering.enrollmentOpenAt)
  const closesAt = timestampMillis(offering.enrollmentCloseAt)
  if (Number.isNaN(opensAt) || Number.isNaN(closesAt)) return false
  return (opensAt === null || opensAt <= now) && (closesAt === null || closesAt >= now)
}

// ─── Catalogue validation ─────────────────────────────────────────────────

export function validateDemoCatalogueRequest(request, programDoc, offeringDoc) {
  if (!programDoc.exists || !offeringDoc.exists) {
    throw new RequestRejectedError(404, 'This demo class is no longer available.')
  }

  const program = programDoc.data()
  const offering = offeringDoc.data()

  if (!isDemoEligibleProgramId(request.programId)) {
    throw new RequestRejectedError(409, 'This program is not eligible for the $10 demo class.')
  }
  // Defense in depth: the code allowlist above and this authoritative
  // Firestore flag must BOTH agree. A future program config change can
  // revoke demo eligibility (demoEligible: false) without a code deploy.
  if (program.isActive !== true || program.publicCatalogVersion !== 1 || program.demoEligible !== true) {
    throw new RequestRejectedError(409, 'This program is not currently accepting $10 demo registrations.')
  }
  if (
    offering.programId !== request.programId
    || offering.offeringType !== 'demo'
    || offering.publicCatalogVersion !== 1
    || offering.isPublished !== true
    || !OFFERING_ACTIVE_STATUSES.has(offering.status)
    || !registrationWindowIsOpen(offering)
  ) {
    throw new RequestRejectedError(409, 'This demo class schedule is not accepting registrations.')
  }

  const seats = availableSeats(offering)
  if (seats === null) {
    throw new RequestRejectedError(409, 'This demo class schedule is missing capacity information. Please contact us.')
  }
  const isFull = offering.status === 'Full' || seats === 0
  if (isFull) {
    throw new RequestRejectedError(409, 'This demo class is full. Please contact us for another option.')
  }

  return { program, offering }
}

// ─── Idempotency ──────────────────────────────────────────────────────────

export function idempotencyDigest(request) {
  return crypto.createHash('sha256')
    .update(`${request.programId}|${request.demoOfferingId}|${request.clientRequestId}`)
    .digest('hex')
}

function idempotencyRef(db, request) {
  const digest = idempotencyDigest(request)
  return db.collection('demoRequestKeys').doc(digest)
}

function activeIdempotencyRecord(snapshot) {
  if (!snapshot?.exists) return null
  const data = snapshot.data()
  const expiresAt = data.expiresAt?.toMillis?.() || 0
  return expiresAt > Date.now() ? data : null
}

// ─── Save (transactional) ─────────────────────────────────────────────────

// Exported for tests (see tests/submit-demo-registration.test.mjs), which
// exercise this against a lightweight fake Firestore transaction harness
// rather than a real emulator.
export async function saveDemoRegistration(db, request) {
  const { programId, demoOfferingId, registration } = request
  const programRef = db.collection('programs').doc(programId)
  const offeringRef = db.collection('programOfferings').doc(demoOfferingId)
  // Allocated up front (db.collection(...).doc() never touches Firestore) so
  // the transaction can reference a stable id — both for the demoRegistrations
  // doc itself and its 1:1 demoCredits doc — before it commits.
  const registrationRef = db.collection('demoRegistrations').doc()
  const requestKeyRef = idempotencyRef(db, request)
  const { priceCents, currency } = getDemoPricing()

  return db.runTransaction(async tx => {
    // (a) Idempotency check.
    const requestKey = await tx.get(requestKeyRef)
    const duplicate = activeIdempotencyRecord(requestKey)
    if (duplicate) {
      return { id: duplicate.demoRegistrationId, reference: duplicate.reference, duplicate: true }
    }

    // (b) Re-read program + offering inside the transaction and validate.
    const programDoc = await tx.get(programRef)
    const offeringDoc = await tx.get(offeringRef)
    const { program, offering } = validateDemoCatalogueRequest(request, programDoc, offeringDoc)

    // (c) Eligibility hash + one-time-offer lock check.
    const childEligibilityKeyHash = computeChildEligibilityKeyHash(registration)
    const lockRef = db.collection('demoEligibilityLocks').doc(childEligibilityKeyHash)
    const lockDoc = await tx.get(lockRef)
    if (lockDoc.exists) {
      throw new RequestRejectedError(
        409,
        'This child has already used their one-time $10 demo offer. Please contact us if you believe this is a mistake.',
      )
    }

    // (e) Re-derive capacity from the freshly-read offering doc — defense
    // against a race even though the lock above mostly prevents a duplicate
    // for the SAME child; a different child could still race for the last seat.
    const seats = availableSeats(offering)
    if (seats === null || seats <= 0) {
      throw new RequestRejectedError(409, 'This demo class is full. Please contact us for another option.')
    }

    // (g) Public registration number, DEMO-{year}-{seq}, same counters/
    // {prefix}-{year} sequence pattern as submit-enrollment-request.js. Read
    // BEFORE any writes below — Firestore transactions require every read to
    // happen before the first write, and the fake-transaction harness in
    // tests/submit-demo-registration.test.mjs doesn't enforce that ordering,
    // so a violation here only surfaces against real Firestore.
    const year = new Date().getFullYear()
    const counterRef = db.collection('counters').doc(`DEMO-${year}`)
    const counter = await tx.get(counterRef)
    const previousSequence = counter.exists ? Number(counter.data().seq) : 0
    if (!Number.isSafeInteger(previousSequence) || previousSequence < 0) {
      throw new RequestRejectedError(409, 'The demo registration number sequence requires staff review. Please contact us.')
    }
    const nextSequence = previousSequence + 1
    const registrationNumber = `DEMO-${year}-${String(nextSequence).padStart(4, '0')}`

    // (d) Create the lock. tx.create() (not tx.set()) is the concurrency
    // primitive: Firestore fails the whole transaction if this document
    // already exists, which is what makes this dedup check atomic under
    // concurrent requests rather than a check-then-act race.
    tx.create(lockRef, {
      demoRegistrationId: registrationRef.id,
      createdAt: FieldValue.serverTimestamp(),
    })

    // (f) Hold a seat on the offering.
    tx.update(offeringRef, {
      heldCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    })

    tx.set(counterRef, { seq: nextSequence, updatedAt: FieldValue.serverTimestamp() }, { merge: true })

    // (h) Create the demo registration record. Price is ALWAYS resolved from
    // getDemoPricing() — never read from the request body.
    tx.create(registrationRef, {
      demoProgramId: programId,
      demoOfferingId,
      registrationType: 'demo',
      demoStatus: 'registered',
      conversionStatus: 'not_converted',
      convertedRegistrationId: null,
      paymentProvider: 'etransfer',
      paymentSessionId: null,
      paymentIntentId: null,
      paymentStatus: 'pending',
      priceCents,
      currency,
      parentName: registration.parentName,
      parentEmail: registration.parentEmail,
      parentPhone: registration.parentPhone,
      childName: registration.childName,
      childAge: registration.childAge,
      childEligibilityKeyHash,
      registrationNumber,
      consentAccepted: true,
      requestConsentVersion: DEMO_CONSENT_VERSION,
      requestConsentRecordedAt: FieldValue.serverTimestamp(),
      // Snapshotted from the offering/program docs validated above, so a
      // later admin edit to the offering (e.g. changing the event time)
      // never rewrites what this registration's confirmation/e-transfer
      // page and emails already told the family.
      eventSnapshot: {
        eventTitle: offering.eventTitle ?? null,
        eventStartAt: offering.eventStartAt ?? null,
        eventEndAt: offering.eventEndAt ?? null,
        timezone: offering.timezone ?? null,
        location: offering.location ?? null,
        ageRange: program.ageRange ?? null,
        registrationReference: registrationNumber,
      },
      // Sanitized in validatePayload via sanitizeAttribution() — never the
      // raw client object. Missing/invalid attribution never blocks this
      // write; every field is simply null.
      marketingAttribution: {
        ...request.marketingAttribution,
        capturedAt: FieldValue.serverTimestamp(),
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    // (i) 1:1 demo credit doc, created pending_attendance. This repo never
    // transitions it further — attendance-driven activation happens in the
    // platform repo's staff actions, and automatic application happens in
    // submit-enrollment-request.js's saveEnrollmentRequest (see that file).
    const creditRef = db.collection('demoCredits').doc(registrationRef.id)
    tx.create(creditRef, {
      demoRegistrationId: registrationRef.id,
      childEligibilityKeyHash,
      amountCents: priceCents,
      currency,
      status: 'pending_attendance',
      createdAt: FieldValue.serverTimestamp(),
      activatedAt: null,
      appliedAt: null,
      appliedToRegistrationId: null,
      appliedByUid: null,
      matchMethod: null,
      subtotalBeforeCreditCents: null,
      creditAppliedCents: null,
      finalAmountCents: null,
    })

    // (j) Idempotency record.
    tx.set(requestKeyRef, {
      demoRegistrationId: registrationRef.id,
      reference: registrationNumber,
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: FieldValue.serverTimestamp(),
    })

    return { id: registrationRef.id, reference: registrationNumber, duplicate: false, program, offering }
  })
}

export const handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...JSON_HEADERS, Allow: 'POST' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  // Fail-closed gate, checked FIRST, before any other work.
  if (!demoPaymentsEnabled()) {
    return json(503, { error: 'Demo registration is temporarily unavailable.' })
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

  const validated = validatePayload(body)
  if (validated.error) return json(400, { error: validated.error })

  try {
    const db = getAdminDb()
    if (!await enforceRateLimit(db, event)) {
      return json(429, { error: 'Too many requests. Please wait a few minutes and try again.' })
    }

    const saved = await saveDemoRegistration(db, validated)
    if (!saved.duplicate) {
      await sendDemoAcknowledgement({
        registration: validated.registration,
        program: saved.program,
        offering: saved.offering,
        reference: saved.reference,
      })
    }

    return json(201, { registrationNumber: saved.reference, demoRegistrationId: saved.id })
  } catch (error) {
    if (error instanceof RequestRejectedError) {
      return json(error.statusCode, { error: error.message })
    }
    console.error('submit-demo-registration failed:', error)
    return json(500, { error: 'We could not save your demo registration. Please try again or contact Kriana Tutoring.' })
  }
}

// Re-exported for tests and other server modules. computeChildEligibilityKeyHash
// itself lives in lib/demo-eligibility-crypto.js (not here) specifically so
// submit-enrollment-request.js's automatic-credit-application step can import
// it without creating a circular import between the two submission endpoints,
// and so it never gets pulled into a client bundle (it uses node:crypto).
export { DEMO_ELIGIBLE_PROGRAM_IDS, computeChildEligibilityKeyHash }
