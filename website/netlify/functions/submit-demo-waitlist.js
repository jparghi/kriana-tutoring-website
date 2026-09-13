// $10 demo WAITLIST — public submission endpoint.
//
// Two situations post here, both gated on the offering's waitlistEnabled
// switch:
//
//   'sold_out'  — the demo is fully booked (or staff paused public booking
//                 via publicRegistrationPaused). The family wants a seat at
//                 THIS demo if one frees up.
//   'next_demo' — the demo's registration window has closed (usually because
//                 the event already happened). /demo stays live year-round as
//                 the "next Young Engineers demo" waitlist, and entries queue
//                 against the most recent demo offering until a new one is
//                 created and DEMO_CAMPAIGN_OFFERING_ID is repointed.
//
// Either way the entry is inert (below) and no payment is ever requested.
//
// A waitlist entry is deliberately inert. Unlike a demo registration it
// NEVER: holds a seat (heldCount), allocates a DEMO-{year}-{seq} number,
// creates a demoEligibilityLocks doc (so the child can still book a future
// $10 demo), creates a demoCredits doc, or sends e-transfer instructions.
// It only writes one `waitlist` doc (the same collection, status and
// position/WL- reference shape the regular-program waitlist in
// submit-enrollment-request.js uses, tagged waitlistType: 'demo' so the
// platform's Waitlist tab never runs regular-enrollment seat offers on it).
import crypto from 'node:crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'
import { RequestRejectedError, enforceRateLimit } from './submit-enrollment-request.js'
import {
  activeIdempotencyRecord,
  assertLiveDemoOffering,
  demoPaymentsEnabled,
  demoPublicBookingState,
  validatePayload,
} from './submit-demo-registration.js'
import { sendDemoWaitlistAcknowledgement } from './_lib/demo-email.js'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}
const MAX_BODY_BYTES = 20 * 1024
const DEMO_WAITLIST_CONSENT_VERSION = 'demo-waitlist-v1'
// Optional "which program are you interested in?" answer. Stored as a plain
// tag for staff follow-up — it commits the family to nothing and is never
// used to pick an offering, so an unrecognized value is simply dropped.
const PROGRAM_INTEREST_OPTIONS = new Set(['smartivo', 'bricks-challenge', 'algo-play', 'not-sure'])

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) }
}

// Accepts a waitlist join only while the offering is live, publicly
// un-bookable, and waitlistEnabled — either because it's full ('sold_out')
// or because its registration window has closed ('next_demo'). Never while
// seats are actually on sale: those families must register instead.
// Exported for tests.
export function validateDemoWaitlistRequest(request, programDoc, offeringDoc) {
  const { program, offering } = assertLiveDemoOffering(request, programDoc, offeringDoc)
  const state = demoPublicBookingState(offering)
  if (state === 'open') {
    throw new RequestRejectedError(409, 'Spots are still available for this demo. Please register instead.')
  }
  if ((state !== 'full' && state !== 'closed') || offering.waitlistEnabled !== true) {
    throw new RequestRejectedError(409, 'The waitlist is not open for this demo.')
  }
  return { program, offering, waitlistKind: state === 'closed' ? 'next_demo' : 'sold_out' }
}

// Exported for tests. Returns null for anything not on the list.
export function normalizeProgramInterest(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase().slice(0, 40)
  return PROGRAM_INTEREST_OPTIONS.has(normalized) ? normalized : null
}

// Prefixed so a waitlist join can never collide with a demo registration's
// idempotency key in the shared demoRequestKeys collection.
export function waitlistIdempotencyDigest(request) {
  return crypto.createHash('sha256')
    .update(`waitlist|${request.programId}|${request.demoOfferingId}|${request.clientRequestId}`)
    .digest('hex')
}

function nonNegativeInteger(value) {
  const number = Number(value ?? 0)
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new RequestRejectedError(409, 'The waitlist queue requires staff review before another request can be accepted. Please contact us.')
  }
  return number
}

export async function saveDemoWaitlistEntry(db, request) {
  const { programId, demoOfferingId, registration } = request
  const programRef = db.collection('programs').doc(programId)
  const offeringRef = db.collection('programOfferings').doc(demoOfferingId)
  // Same waitlistCounters/{offeringId-…} doc the regular-program waitlist
  // uses, so positions stay one sequence per offering.
  const counterRef = db.collection('waitlistCounters').doc(`offeringId-${demoOfferingId}`)
  const entryRef = db.collection('waitlist').doc()
  const requestKeyRef = db.collection('demoRequestKeys').doc(waitlistIdempotencyDigest(request))
  const publicReference = `WL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

  return db.runTransaction(async tx => {
    // Every read happens before the first write (Firestore transaction rule).
    const requestKey = await tx.get(requestKeyRef)
    const duplicate = activeIdempotencyRecord(requestKey)
    if (duplicate) {
      return { id: duplicate.waitlistEntryId, reference: duplicate.reference, duplicate: true }
    }

    const programDoc = await tx.get(programRef)
    const offeringDoc = await tx.get(offeringRef)
    const { program, offering, waitlistKind } = validateDemoWaitlistRequest(request, programDoc, offeringDoc)

    const counter = await tx.get(counterRef)
    let previousPosition = 0
    if (counter.exists) {
      previousPosition = nonNegativeInteger(counter.data().lastPosition)
    } else {
      const existing = await tx.get(db.collection('waitlist').where('offeringId', '==', demoOfferingId))
      for (const document of existing.docs) {
        previousPosition = Math.max(previousPosition, nonNegativeInteger(document.data().position))
      }
    }
    const position = previousPosition + 1

    tx.set(counterRef, { lastPosition: position, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    tx.create(entryRef, {
      programId,
      offeringId: demoOfferingId,
      waitlistType: 'demo',
      // Which story the family signed up under — 'sold_out' wants this
      // demo's next free seat, 'next_demo' wants the one after it.
      demoWaitlistKind: waitlistKind,
      programInterest: request.programInterest ?? null,
      parentName: registration.parentName,
      parentEmail: registration.parentEmail,
      parentPhone: registration.parentPhone,
      childName: registration.childName,
      childAge: registration.childAge,
      consentAccepted: true,
      requestConsentVersion: DEMO_WAITLIST_CONSENT_VERSION,
      requestConsentRecordedAt: FieldValue.serverTimestamp(),
      status: 'Waiting',
      position,
      publicReference,
      programSnapshot: { title: program.title || '' },
      // Snapshotted like a demo registration's eventSnapshot, so the portal
      // shows which demo this family was waitlisted for even after the
      // offering is edited or a new campaign offering replaces it.
      eventSnapshot: {
        eventTitle: offering.eventTitle ?? null,
        eventStartAt: offering.eventStartAt ?? null,
        eventEndAt: offering.eventEndAt ?? null,
        timezone: offering.timezone ?? null,
        location: offering.location ?? null,
      },
      marketingAttribution: {
        ...request.marketingAttribution,
        capturedAt: FieldValue.serverTimestamp(),
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    tx.set(requestKeyRef, {
      waitlistEntryId: entryRef.id,
      reference: publicReference,
      requestedAction: 'waitlist',
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: FieldValue.serverTimestamp(),
    })

    return { id: entryRef.id, reference: publicReference, duplicate: false, program, offering, waitlistKind }
  })
}

export const handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...JSON_HEADERS, Allow: 'POST' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  // Same fail-closed product gate as submit-demo-registration.js.
  if (!demoPaymentsEnabled()) {
    return json(503, { error: 'The demo waitlist is temporarily unavailable.' })
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

  // Same 5-field payload + consent + attribution as a demo registration.
  const validated = validatePayload(body)
  if (validated.error) return json(400, { error: validated.error })
  validated.programInterest = normalizeProgramInterest(body.programInterest)

  try {
    const db = getAdminDb()
    if (!await enforceRateLimit(db, event)) {
      return json(429, { error: 'Too many requests. Please wait a few minutes and try again.' })
    }

    const saved = await saveDemoWaitlistEntry(db, validated)
    if (!saved.duplicate) {
      await sendDemoWaitlistAcknowledgement({
        registration: validated.registration,
        program: saved.program,
        offering: saved.offering,
        reference: saved.reference,
        waitlistKind: saved.waitlistKind,
        programInterest: validated.programInterest,
      })
    }

    return json(201, { reference: saved.reference })
  } catch (error) {
    if (error instanceof RequestRejectedError) {
      return json(error.statusCode, { error: error.message })
    }
    console.error('submit-demo-waitlist failed:', error)
    return json(500, { error: 'We could not add you to the waitlist. Please try again or contact Kriana Tutoring.' })
  }
}
