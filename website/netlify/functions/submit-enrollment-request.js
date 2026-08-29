import crypto from 'node:crypto'
import nodemailer from 'nodemailer'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'
import { emailSignatureHtml } from './_lib/email-signature.js'
import {
  isValidPackageId, getRoboticsPackage, buildPackageSnapshot,
  getAllowedInstallmentCounts, buildPaymentPreferenceSnapshot,
} from '../../lib/robotics-packages.js'
import { DEMO_ELIGIBLE_PROGRAM_IDS } from '../../lib/demo-eligibility.js'
import { computeChildEligibilityKeyHash } from '../../lib/demo-eligibility-crypto.js'

const ROBOTICS_CATEGORY = 'Robotics'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}
const MAX_BODY_BYTES = 20 * 1024
const LEGACY_ACTIVE_STATUSES = new Set(['Active', 'Sold Out'])
const OFFERING_ACTIVE_STATUSES = new Set(['Open', 'Full'])
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) }
}

function bookingMode() {
  return (process.env.BOOKING_FLOW_MODE || process.env.BOOKING_MODE || 'request_only').trim().toLowerCase()
}

function normalizeText(value, maxLength) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

function normalizeMultiline(value, maxLength) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\r\n/g, '\n').slice(0, maxLength)
}

export function validatePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Invalid request body.' }
  }

  const programId = normalizeText(body.programId, 150)
  const offeringId = normalizeText(body.offeringId, 150)
  const sessionId = normalizeText(body.sessionId, 150)
  const clientRequestId = normalizeText(body.clientRequestId, 100)
  const requestedAction = normalizeText(body.requestedAction, 20)
  // The browser only ever sends an id; all pricing/name/class-count details
  // are resolved server-side from the canonical catalogue in validateCatalogueRequest.
  const packageId = normalizeText(body.packageId, 50)
  const input = body.registration

  if (!programId || (!offeringId && !sessionId) || !input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'Program, class schedule, and registration details are required.' }
  }
  if (offeringId && sessionId) {
    return { error: 'Choose exactly one class schedule.' }
  }
  if ([programId, offeringId, sessionId].some(id => id.includes('/'))) {
    return { error: 'Program or class schedule reference is invalid.' }
  }
  if (requestedAction !== 'enrollment' && requestedAction !== 'waitlist') {
    return { error: 'Requested action must be enrollment or waitlist.' }
  }
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(clientRequestId)) {
    return { error: 'Request identifier is invalid.' }
  }
  if (packageId && !isValidPackageId(programId, packageId)) {
    return { error: 'Selected class package is not recognized.' }
  }

  // Payment preference (method + installment count only) is a browser input
  // just like packageId — never a source of trusted amounts. Every dollar
  // figure is (re)computed server-side from the canonical catalogue in
  // buildPaymentPreferenceSnapshot, so any financial fields the client might
  // also send here are simply never read.
  const rawPaymentPreference = body.paymentPreference
  let paymentPreference = null
  if (requestedAction === 'waitlist') {
    if (rawPaymentPreference != null) {
      return { error: 'Payment preference does not apply to waitlist requests.' }
    }
  } else if (packageId) {
    if (!rawPaymentPreference || typeof rawPaymentPreference !== 'object' || Array.isArray(rawPaymentPreference)) {
      return { error: 'Please choose a payment preference before requesting a spot.' }
    }
    const method = normalizeText(rawPaymentPreference.method, 20)
    if (method === 'pay_in_full') {
      paymentPreference = { method: 'pay_in_full', installmentCount: 1 }
    } else if (method === 'installments') {
      const pkg = getRoboticsPackage(programId, packageId)
      const allowed = pkg ? getAllowedInstallmentCounts(pkg) : []
      const installmentCount = Number(rawPaymentPreference.installmentCount)
      if (!allowed.includes(installmentCount)) {
        return { error: 'Selected installment plan is not available for this package.' }
      }
      paymentPreference = { method: 'installments', installmentCount }
    } else {
      return { error: 'Selected payment preference is not recognized.' }
    }
  } else if (rawPaymentPreference != null) {
    return { error: 'Payment preference is only available for class packages.' }
  }

  const registration = {
    parentName: normalizeText(input.parentName, 120),
    parentEmail: normalizeText(input.parentEmail, 254).toLowerCase(),
    parentPhone: normalizeText(input.parentPhone, 40),
    childName: normalizeText(input.childName, 120),
    childAge: Number(String(input.childAge).trim()),
    childGrade: normalizeText(input.childGrade, 50),
    medicalNotes: normalizeMultiline(input.medicalNotes, 1500),
    emergencyContact: normalizeText(input.emergencyContact, 200),
    specialRequests: normalizeMultiline(input.specialRequests, 1500),
    consentAccepted: input.consentAccepted === true,
    photoConsent: input.photoConsent === true,
  }

  if (registration.parentName.length < 2) return { error: 'Please enter the parent or guardian name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.parentEmail)) return { error: 'Please enter a valid email address.' }
  if (registration.parentPhone.replace(/\D/g, '').length < 7) return { error: 'Please enter a valid phone number.' }
  if (registration.childName.length < 2) return { error: "Please enter the child's name." }
  if (!Number.isInteger(registration.childAge) || registration.childAge < 1 || registration.childAge > 18) {
    return { error: "Please enter the child's age between 1 and 18." }
  }
  if (!registration.consentAccepted) return { error: 'Consent is required before submitting.' }

  return { programId, offeringId, sessionId, clientRequestId, requestedAction, packageId, paymentPreference, registration }
}

function toDateValue(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return typeof value === 'string' ? value : null
}

function scheduleSnapshot(session, program) {
  return {
    title: session.title || session.termName || session.termLabel || 'Program schedule',
    startDateTime: toDateValue(session.firstClassDate || session.startDateTime || session.termStartDate),
    endDateTime: toDateValue(session.lastClassDate || session.endDateTime || session.termEndDate),
    location: session.location || '',
    timezone: session.timezone || 'America/Toronto',
    weekday: session.weekday || '',
    startTime: session.startTime || '',
    endTime: session.endTime || '',
    classCount: Number.isInteger(session.classCount) ? session.classCount : null,
    tuitionCents: quotedTuition(program, session),
    currency: session.currency || program.currency || 'CAD',
  }
}

function applyProgramDiscount(baseCents, program) {
  if (!program?.discountActive || !program.discountValue || baseCents <= 0) return baseCents
  return program.discountType === 'amount'
    ? Math.max(0, baseCents - Number(program.discountValue))
    : Math.max(0, Math.round(baseCents * (1 - Math.min(100, Math.max(0, Number(program.discountValue))) / 100)))
}

function quotedTuition(program, session) {
  const value = session.tuitionCents ?? session.price ?? program.price ?? 0
  const baseCents = Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : 0
  return applyProgramDiscount(baseCents, program)
}

function availableSeats(session) {
  const capacity = Number(session.capacity ?? 0)
  const confirmed = Number(session.confirmedCount ?? 0)
  const held = Number(session.heldCount ?? 0)
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

function registrationWindowIsOpen(schedule) {
  const now = Date.now()
  const opensAt = timestampMillis(schedule.enrollmentOpenAt)
  const closesAt = timestampMillis(schedule.enrollmentCloseAt)
  if (Number.isNaN(opensAt) || Number.isNaN(closesAt)) return false
  return (opensAt === null || opensAt <= now) && (closesAt === null || closesAt >= now)
}

function nonNegativeCounter(value, label) {
  const count = Number(value)
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RequestRejectedError(
      409,
      `${label} requires staff review before another request can be accepted. Please contact us.`,
    )
  }
  return count
}

function positiveWaitlistPosition(value) {
  const position = nonNegativeCounter(value, 'The waitlist queue')
  if (position < 1) {
    throw new RequestRejectedError(
      409,
      'The waitlist queue requires staff review before another request can be accepted. Please contact us.',
    )
  }
  return position
}

function ageRange(program, schedule) {
  let min = Number(schedule.minAge ?? schedule.ageMin)
  let max = Number(schedule.maxAge ?? schedule.ageMax)

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    const ages = String(program.ageRange || '').match(/\d+/g)?.map(Number) || []
    if (!Number.isFinite(min)) min = ages[0]
    if (!Number.isFinite(max)) {
      max = ages.length > 1
        ? ages[1]
        : String(program.ageRange || '').includes('+') ? Number.NaN : ages[0]
    }
  }

  return {
    min: Number.isFinite(min) ? min : null,
    max: Number.isFinite(max) ? max : null,
  }
}

export class RequestRejectedError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.name = 'RequestRejectedError'
    this.statusCode = statusCode
  }
}

export function validateCatalogueRequest(request, programDoc, sessionDoc) {
  if (!programDoc.exists || !sessionDoc.exists) {
    throw new RequestRejectedError(404, 'This program or class schedule is no longer available.')
  }

  const program = programDoc.data()
  const session = sessionDoc.data()
  const isOffering = Boolean(request.offeringId)
  const programUsesOfferings = program.bookingModel === 'programOfferings'
    || (Number.isSafeInteger(program.offeringModelVersion) && program.offeringModelVersion >= 1)

  // Once staff publishes the offerings model, legacy session IDs must not be a
  // hidden back door into an older schedule. This check is authoritative; the
  // browser cannot opt a program back into the legacy flow.
  if (!isOffering && programUsesOfferings) {
    throw new RequestRejectedError(409, 'This class schedule has been replaced. Please choose a current offering.')
  }
  if (!isOffering && program.legacyBookingEnabled !== true) {
    throw new RequestRejectedError(409, 'This legacy class schedule is not enabled. Please choose a current offering.')
  }
  const acceptedStatus = isOffering
    ? session.publicCatalogVersion === 1
      && session.isPublished === true
      && OFFERING_ACTIVE_STATUSES.has(session.status)
    : session.legacyPublicBookingVersion === 1
      && LEGACY_ACTIVE_STATUSES.has(session.status)

  if (
    program.isActive !== true
    || program.publicCatalogVersion !== 1
    || session.programId !== request.programId
    || !acceptedStatus
    || !registrationWindowIsOpen(session)
  ) {
    throw new RequestRejectedError(409, 'This program or class schedule is not accepting requests.')
  }

  const allowedAges = ageRange(program, session)
  if (
    (allowedAges.min !== null && request.registration.childAge < allowedAges.min)
    || (allowedAges.max !== null && request.registration.childAge > allowedAges.max)
  ) {
    throw new RequestRejectedError(
      409,
      'This program is not available for the age entered. Please contact us for another option.',
    )
  }

  const seats = availableSeats(session)
  if (seats === null) {
    throw new RequestRejectedError(
      409,
      'This class schedule is missing capacity information. Please contact us.',
    )
  }
  const isFull = session.status === 'Sold Out' || session.status === 'Full' || seats === 0

  if (request.requestedAction === 'waitlist') {
    if (!isFull || session.waitlistEnabled !== true) {
      throw new RequestRejectedError(409, 'The waitlist is not open for this class schedule.')
    }
  } else if (isFull) {
    throw new RequestRejectedError(
      409,
      session.waitlistEnabled === true
        ? 'This class schedule is full. Please return to the program page and join the waitlist.'
        : 'This class schedule is full and its waitlist is closed.',
    )
  }

  // Class packages (Explorer/Builder/Engineer) are a Robotics-only concept.
  // The browser only ever sends a packageId; the package's name, class count,
  // and pricing are always resolved here from the canonical catalogue.
  const isRoboticsCategory = program.category === ROBOTICS_CATEGORY
  if (isRoboticsCategory) {
    if (!request.packageId) {
      throw new RequestRejectedError(400, 'Please choose a class package before requesting a spot.')
    }
    if (!isOffering) {
      throw new RequestRejectedError(
        409,
        'Class packages are only available for current class schedules. Please choose a current offering.',
      )
    }
    const selectedPackage = getRoboticsPackage(request.programId, request.packageId)
    if (!selectedPackage) {
      throw new RequestRejectedError(400, 'Selected class package is not recognized.')
    }
    const offeringClassCount = Number(session.classCount)
    if (!Number.isSafeInteger(offeringClassCount) || offeringClassCount < selectedPackage.classCount) {
      throw new RequestRejectedError(
        409,
        'This class schedule does not have enough classes remaining for the selected package.',
      )
    }
  } else if (request.packageId) {
    throw new RequestRejectedError(400, 'Class packages are only available for Robotics programs.')
  }

  return { program, session }
}

function clientIp(event) {
  const headers = event.headers || {}
  return String(headers['x-nf-client-connection-ip'] || '').trim()
}

// Exported so other submission endpoints (e.g. submit-birthday-request.js)
// share the same IP rate-limit bucket and salt validation instead of
// reimplementing this transaction.
export async function enforceRateLimit(db, event) {
  const salt = process.env.ENROLLMENT_RATE_LIMIT_SALT
  if (!salt || salt.length < 32) {
    throw new Error('ENROLLMENT_RATE_LIMIT_SALT must be configured with at least 32 characters')
  }
  const ip = clientIp(event)
  if (!ip) {
    throw new Error('Trusted client IP header is unavailable')
  }
  const key = crypto.createHmac('sha256', salt).update(ip).digest('hex')
  const ref = db.collection('submissionRateLimits').doc(key)
  const now = Date.now()

  return db.runTransaction(async tx => {
    const snapshot = await tx.get(ref)
    const data = snapshot.exists ? snapshot.data() : null
    const windowStartedAt = data?.windowStartedAt?.toMillis?.() || 0
    const isCurrentWindow = now - windowStartedAt < RATE_LIMIT_WINDOW_MS
    const storedCount = data?.count
    const count = isCurrentWindow ? Number(storedCount) : 0
    if (isCurrentWindow && (!Number.isSafeInteger(count) || count < 0)) {
      throw new Error('Enrollment rate-limit counter is invalid')
    }

    if (count >= RATE_LIMIT_MAX_REQUESTS) return false

    tx.set(ref, {
      count: count + 1,
      windowStartedAt: Timestamp.fromMillis(isCurrentWindow ? windowStartedAt : now),
      expiresAt: Timestamp.fromMillis(now + 24 * 60 * 60 * 1000),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return true
  })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

// Mirrors formatTimeOfDay in lib/booking.ts (duplicated rather than imported —
// see the note atop _lib/demo-email.js re: this file's client-side/server-side split).
function formatTimeOfDay(value) {
  if (!value) return ''
  if (typeof value !== 'string') {
    const d = value?.toDate ? value.toDate() : new Date(value)
    return d.toLocaleTimeString('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit' })
  }
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return value
  const d = new Date(2000, 0, 1, Number(match[1]), Number(match[2]))
  return d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })
}

function formatSchedule(session) {
  const title = session.title || session.termName || session.termLabel
  const start = toDateValue(session.firstClassDate || session.startDateTime || session.termStartDate)

  // The offering's own weekday/startTime/endTime are the source of truth for
  // which time slot the family picked (e.g. distinguishing "Batch 1" from
  // "Batch 2" on the same weekday) — firstClassDate/startDateTime only pins
  // the calendar date and can't be trusted for time-of-day if it drifts from
  // startTime (e.g. an offering cloned from another batch without updating
  // its first-class-date timestamp).
  if (session.weekday && session.startTime) {
    const dayLabel = start
      ? start.toLocaleDateString('en-CA', { timeZone: session.timezone || 'America/Toronto', weekday: 'long' })
      : (() => {
          const day = String(session.weekday)
          return day.endsWith('s') ? day : `${day}s`
        })()
    const dateLabel = start
      ? `, ${start.toLocaleDateString('en-CA', { timeZone: session.timezone || 'America/Toronto', month: 'long', day: 'numeric', year: 'numeric' })}`
      : ''
    const startTime = formatTimeOfDay(session.startTime)
    const endTime = formatTimeOfDay(session.endTime)
    const timeLabel = endTime ? `${startTime}–${endTime}` : startTime
    const date = `${dayLabel}${dateLabel} at ${timeLabel}`
    return title ? `${title} — ${date}` : date
  }

  if (!start) return title || 'Schedule to be confirmed'

  const date = new Date(start).toLocaleString('en-CA', {
    timeZone: session.timezone || 'America/Toronto',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  return title ? `${title} — ${date}` : date
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

function formatAmount(cents) {
  return `$${(Number(cents ?? 0) / 100).toFixed(2)} CAD`
}

// Renders the full chosen payment plan — every installment's exact amount,
// not just a rounded "approximately $X each" summary — so the family and
// staff both see precisely what was agreed to (the last installment is
// often a cent or two different from the others; see
// computeInstallmentAmountsCents in lib/robotics-packages.js).
//
// The Back-to-School promotion is a pay-in-full incentive only — an
// installment plan always uses the package's regular price, even while the
// promotion is active, so these two branches deliberately show different
// totals (payableSubtotalCents vs. regularSubtotalCents) rather than one
// shared "effective subtotal".
function paymentPreferenceHtml(snapshot) {
  if (!snapshot) return ''
  if (snapshot.method === 'pay_in_full') {
    const promoNote = snapshot.promotionApplied
      ? ` — includes the Back-to-School first-class-free offer (save ${formatAmount(snapshot.promotionDiscountCents)})`
      : ''
    return `<p style="margin:0 0 8px"><strong>Payment preference:</strong> Pay in full — ${formatAmount(snapshot.payableSubtotalCents)} (plus applicable taxes)${promoNote}</p>`
  }
  const installmentRows = snapshot.installmentAmountsCents
    .map((cents, i) => `<li>Installment ${i + 1} of ${snapshot.installmentCount}: ${formatAmount(cents)}</li>`)
    .join('')
  return `
          <p style="margin:0 0 4px"><strong>Payment preference:</strong> ${snapshot.installmentCount}-installment plan — regular package subtotal ${formatAmount(snapshot.regularSubtotalCents)} (plus applicable taxes). The Back-to-School offer applies only when paying in full.</p>
          <ul style="margin:2px 0 8px 18px;padding:0">${installmentRows}</ul>`
}

async function sendAcknowledgements({ registration, program, session, reference, isWaitlist, packageSnapshot, paymentPreferenceSnapshot }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Enrollment request saved; SMTP credentials are not configured, so email was skipped.')
    return
  }

  const programTitle = escapeHtml(program.title || 'Kriana program')
  const parentName = escapeHtml(registration.parentName)
  const childName = escapeHtml(registration.childName)
  const schedule = escapeHtml(formatSchedule(session))
  const location = session.location ? escapeHtml(session.location) : ''
  const safeReference = escapeHtml(reference)
  const fromAddress = `"Kriana Tutoring" <${process.env.SMTP_USER}>`
  const adminEmail = process.env.ADMIN_EMAIL || 'info@krianatutoring.com'
  const parentSubject = isWaitlist
    ? `Waitlist request received — ${program.title || 'Kriana program'}`
    : `Registration request received — ${program.title || 'Kriana program'}`

  const parentHtml = `
    <div style="max-width:600px;margin:24px auto;font-family:Arial,sans-serif;color:#1e293b">
      <div style="background:#0c6162;color:white;padding:28px;border-radius:16px 16px 0 0">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase">Kriana Tutoring</p>
        <h1 style="margin:0;font-size:24px">${isWaitlist ? 'Waitlist request received' : 'Registration request received'}</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:0;padding:28px;border-radius:0 0 16px 16px">
        <p>Hi ${parentName},</p>
        <p>We received your request for <strong>${childName}</strong> to join <strong>${programTitle}</strong>.</p>
        <div style="background:#f8fafc;padding:16px;border-radius:10px;margin:18px 0">
          <p style="margin:0 0 8px"><strong>Schedule:</strong> ${schedule}</p>
          ${location ? `<p style="margin:0 0 8px"><strong>Location:</strong> ${location}</p>` : ''}
          ${packageSnapshot ? `<p style="margin:0 0 8px"><strong>Package:</strong> ${escapeHtml(packageSnapshot.name)} — ${packageSnapshot.classCount} classes · ${formatAmount(packageSnapshot.perClassCents)}/class · ${formatAmount(packageSnapshot.regularSubtotalCents)} package subtotal (plus applicable taxes)</p>` : ''}
          ${paymentPreferenceHtml(paymentPreferenceSnapshot)}
          <p style="margin:0"><strong>Reference:</strong> ${safeReference}</p>
        </div>
        <p><strong>No payment is due now.</strong> This request does not yet confirm a place. Our team will review availability and contact you with next steps${isWaitlist ? ' if a place becomes available' : ''}. Staff will follow up with placement and payment details after reviewing your request.</p>
        <p>Questions? Reply to this email or call <a href="tel:+16134006921">(613) 400-6921</a>.</p>
        ${emailSignatureHtml()}
      </div>
    </div>`

  const adminSubject = `${isWaitlist ? 'Waitlist' : 'Enrollment'} request — ${program.title || 'Program'} — ${registration.childName}`
  const adminHtml = `
    <h2>${isWaitlist ? 'New waitlist request' : 'New registration request'}</h2>
    <p><strong>Reference:</strong> ${safeReference}</p>
    <p><strong>Program:</strong> ${programTitle}</p>
    <p><strong>Schedule:</strong> ${schedule}</p>
    ${packageSnapshot ? `<p><strong>Package:</strong> ${escapeHtml(packageSnapshot.name)} — ${packageSnapshot.classCount} classes · ${formatAmount(packageSnapshot.perClassCents)}/class · ${formatAmount(packageSnapshot.regularSubtotalCents)} subtotal</p>` : ''}
    ${paymentPreferenceHtml(paymentPreferenceSnapshot)}
    <p><strong>Child:</strong> ${childName} (age ${escapeHtml(registration.childAge)}${registration.childGrade ? `, ${escapeHtml(registration.childGrade)}` : ''})</p>
    <p><strong>Parent:</strong> ${parentName} · ${escapeHtml(registration.parentEmail)} · ${escapeHtml(registration.parentPhone)}</p>
    <p>Review the private registration record in the program management portal for all additional details.</p>`

  const transport = createTransport()
  const results = await Promise.allSettled([
    transport.sendMail({ from: fromAddress, to: registration.parentEmail, subject: parentSubject, html: parentHtml }),
    transport.sendMail({ from: fromAddress, to: adminEmail, subject: adminSubject, html: adminHtml }),
  ])
  for (const result of results) {
    if (result.status === 'rejected') console.error('Enrollment acknowledgement email failed:', result.reason)
  }
}

export function idempotencyDigest(request) {
  const scheduleId = request.offeringId || request.sessionId
  return crypto.createHash('sha256')
    .update(`${request.programId}|${scheduleId}|${request.requestedAction}|${request.packageId || ''}|${request.clientRequestId}`)
    .digest('hex')
}

function idempotencyRef(db, request) {
  if (!request.clientRequestId) return null
  const digest = idempotencyDigest(request)
  return db.collection('enrollmentRequestKeys').doc(digest)
}

function activeIdempotencyRecord(snapshot) {
  if (!snapshot?.exists) return null
  const data = snapshot.data()
  const expiresAt = data.expiresAt?.toMillis?.() || 0
  return expiresAt > Date.now() ? data : null
}

async function saveWaitlistRequest(db, request) {
  const { programId, offeringId, sessionId, registration } = request
  const scheduleId = offeringId || sessionId
  const scheduleField = offeringId ? 'offeringId' : 'sessionId'
  const programRef = db.collection('programs').doc(programId)
  const scheduleRef = offeringId
    ? db.collection('programOfferings').doc(offeringId)
    : db.collection('sessions').doc(sessionId)
  const counterRef = db.collection('waitlistCounters').doc(`${scheduleField}-${scheduleId}`)
  const ref = db.collection('waitlist').doc()
  const requestKeyRef = idempotencyRef(db, request)
  const publicReference = `WL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

  return db.runTransaction(async tx => {
    const requestKey = requestKeyRef ? await tx.get(requestKeyRef) : null
    const duplicate = activeIdempotencyRecord(requestKey)
    if (duplicate) {
      return { id: duplicate.registrationId, reference: duplicate.reference, duplicate: true }
    }

    const programDoc = await tx.get(programRef)
    const sessionDoc = await tx.get(scheduleRef)
    const { program, session } = validateCatalogueRequest(request, programDoc, sessionDoc)
    const counter = await tx.get(counterRef)
    let baseline = 0
    if (!counter.exists) {
      const existing = await tx.get(db.collection('waitlist').where(scheduleField, '==', scheduleId))
      for (const document of existing.docs) {
        baseline = Math.max(
          baseline,
          positiveWaitlistPosition(document.data().position),
        )
      }
    }
    const previousPosition = counter.exists
      ? nonNegativeCounter(counter.data().lastPosition, 'The waitlist queue')
      : baseline
    const position = nonNegativeCounter(previousPosition + 1, 'The waitlist queue')
    tx.set(counterRef, { lastPosition: position, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    tx.create(ref, {
      programId,
      ...(offeringId ? { offeringId } : { sessionId, legacySessionId: sessionId }),
      parentName: registration.parentName,
      parentEmail: registration.parentEmail,
      parentPhone: registration.parentPhone,
      childName: registration.childName,
      childAge: registration.childAge,
      childGrade: registration.childGrade,
      medicalNotes: registration.medicalNotes,
      emergencyContact: registration.emergencyContact,
      specialRequests: registration.specialRequests,
      consentAccepted: true,
      requestConsentVersion: 'enrollment-request-v1',
      requestConsentRecordedAt: FieldValue.serverTimestamp(),
      photoConsent: registration.photoConsent,
      status: 'Waiting',
      position,
      publicReference,
      bookingFlowMode: 'request_only',
      quotedTuitionCents: quotedTuition(program, session),
      currency: session.currency || program.currency || 'CAD',
      ...(request.packageId ? { packageSnapshot: buildPackageSnapshot(request.programId, request.packageId) } : {}),
      programSnapshot: { title: program.title || '' },
      scheduleSnapshot: scheduleSnapshot(session, program),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    if (requestKeyRef) {
      tx.set(requestKeyRef, {
        registrationId: ref.id,
        reference: publicReference,
        requestedAction: 'waitlist',
        expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    return {
      id: ref.id,
      reference: publicReference,
      duplicate: false,
      program,
      session,
      packageSnapshot: request.packageId ? buildPackageSnapshot(request.programId, request.packageId) : null,
    }
  })
}

// ─── Additive: automatic $10 demo-credit application ──────────────────────
//
// This is the ONLY point of contact between the request_only enrollment
// flow and the separate $10 Young Engineers Demo Registration product. It is
// deliberately self-contained and called from exactly one well-contained
// point inside saveEnrollmentRequest's transaction, and it must NEVER change
// registrationStatus, paymentStatus, amountDue, or amountPaid — those stay
// exactly 'Pending Review' / 'Not Requested' / 0 / 0 as they are today. A
// lookup failure (most commonly: DEMO_ELIGIBILITY_KEY_SALT not configured in
// an environment that hasn't enabled the demo product) is swallowed and
// logged rather than allowed to fail the enrollment request itself — this is
// a pure convenience, never a requirement for a regular enrollment request
// to succeed.
//
// Must be called BEFORE any transaction writes: Firestore transactions
// require all reads to complete before the first write.
async function findAvailableDemoCredit(db, tx, programId, packageId, registration) {
  if (!packageId || !DEMO_ELIGIBLE_PROGRAM_IDS.includes(programId)) return null
  try {
    const hash = computeChildEligibilityKeyHash(registration)
    const snap = await tx.get(
      db.collection('demoCredits')
        .where('childEligibilityKeyHash', '==', hash)
        .where('status', '==', 'available')
        .limit(2)
    )
    // Zero matches: nothing to apply. More than one: ambiguous — leave for
    // manual staff matching rather than guessing which credit applies.
    if (snap.size !== 1) return null
    const doc = snap.docs[0]
    return { ref: doc.ref, id: doc.id, data: doc.data() }
  } catch (err) {
    console.warn('Automatic demo-credit lookup skipped:', err.message)
    return null
  }
}

/** Computed only when a demo credit was found AND a payment preference
 * snapshot exists (always true for a robotics package submission — see
 * validatePayload). Returns null if no credit applies or the subtotal isn't
 * a valid amount to apply a credit against. */
function computeDemoCreditApplication(demoCredit, paymentPreferenceSnapshot) {
  if (!demoCredit) return null
  const subtotalBeforeCreditCents = paymentPreferenceSnapshot?.payableSubtotalCents
  if (!Number.isSafeInteger(subtotalBeforeCreditCents) || subtotalBeforeCreditCents < 0) return null
  const creditAmountCents = Math.min(demoCredit.data.amountCents ?? 1000, subtotalBeforeCreditCents)
  const finalAmountCents = subtotalBeforeCreditCents - creditAmountCents
  return {
    demoRegistrationId: demoCredit.data.demoRegistrationId ?? null,
    creditAmountCents,
    subtotalBeforeCreditCents,
    finalAmountCents,
  }
}

async function saveEnrollmentRequest(db, request) {
  const { programId, offeringId, sessionId, registration } = request
  const programRef = db.collection('programs').doc(programId)
  const scheduleRef = offeringId
    ? db.collection('programOfferings').doc(offeringId)
    : db.collection('sessions').doc(sessionId)
  const registrationRef = db.collection('registrations').doc()
  const requestKeyRef = idempotencyRef(db, request)

  return db.runTransaction(async tx => {
    const requestKey = requestKeyRef ? await tx.get(requestKeyRef) : null
    const duplicate = activeIdempotencyRecord(requestKey)
    if (duplicate) {
      return { id: duplicate.registrationId, reference: duplicate.reference, duplicate: true }
    }

    const programDoc = await tx.get(programRef)
    const sessionDoc = await tx.get(scheduleRef)
    const { program, session } = validateCatalogueRequest(request, programDoc, sessionDoc)
    const year = new Date().getFullYear()
    const prefix = program.partnerName ? 'YE' : 'KT'
    const counterRef = db.collection('counters').doc(`${prefix}-${year}`)
    const counter = await tx.get(counterRef)
    const previousSequence = counter.exists
      ? nonNegativeCounter(counter.data().seq, 'The registration number sequence')
      : 0
    const nextSequence = nonNegativeCounter(previousSequence + 1, 'The registration number sequence')
    const number = `${prefix}-${year}-${String(nextSequence).padStart(4, '0')}`
    const paymentPreferenceSnapshot = request.paymentPreference
      ? buildPaymentPreferenceSnapshot(request.programId, request.packageId, request.paymentPreference)
      : null

    // Additive automatic demo-credit lookup — a read, so it must happen here,
    // before the writes below. See findAvailableDemoCredit's doc comment.
    const demoCredit = await findAvailableDemoCredit(db, tx, programId, request.packageId, registration)
    const demoCreditApplication = computeDemoCreditApplication(demoCredit, paymentPreferenceSnapshot)

    tx.set(counterRef, { seq: nextSequence, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    tx.create(registrationRef, {
      programId,
      ...(offeringId ? { offeringId } : { sessionId, legacySessionId: sessionId }),
      ...registration,
      requestConsentVersion: 'enrollment-request-v1',
      requestConsentRecordedAt: FieldValue.serverTimestamp(),
      registrationNumber: number,
      recordType: 'Enrollment Request',
      requestedAction: 'enrollment',
      bookingFlowMode: 'request_only',
      registrationStatus: 'Pending Review',
      paymentStatus: 'Not Requested',
      amountDue: 0,
      amountPaid: 0,
      quotedTuitionCents: quotedTuition(program, session),
      currency: session.currency || program.currency || 'CAD',
      ...(request.packageId ? { packageSnapshot: buildPackageSnapshot(request.programId, request.packageId) } : {}),
      ...(paymentPreferenceSnapshot ? { paymentPreferenceSnapshot } : {}),
      // Additive only — never changes registrationStatus, paymentStatus,
      // amountDue, or amountPaid above. Absent entirely unless exactly one
      // available demo credit matched this child.
      ...(demoCreditApplication ? { creditApplied: demoCreditApplication } : {}),
      programSnapshot: {
        title: program.title || '',
        category: program.category || '',
        partnerName: program.partnerName || '',
      },
      scheduleSnapshot: scheduleSnapshot(session, program),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    if (demoCredit && demoCreditApplication) {
      tx.update(demoCredit.ref, {
        status: 'applied',
        matchMethod: 'automatic',
        appliedAt: FieldValue.serverTimestamp(),
        appliedToRegistrationId: registrationRef.id,
        subtotalBeforeCreditCents: demoCreditApplication.subtotalBeforeCreditCents,
        creditAppliedCents: demoCreditApplication.creditAmountCents,
        finalAmountCents: demoCreditApplication.finalAmountCents,
      })
    }
    if (requestKeyRef) {
      tx.set(requestKeyRef, {
        registrationId: registrationRef.id,
        reference: number,
        requestedAction: 'enrollment',
        expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    return {
      id: registrationRef.id,
      reference: number,
      duplicate: false,
      program,
      session,
      packageSnapshot: request.packageId ? buildPackageSnapshot(request.programId, request.packageId) : null,
      paymentPreferenceSnapshot: request.paymentPreference
        ? buildPaymentPreferenceSnapshot(request.programId, request.packageId, request.paymentPreference)
        : null,
    }
  })
}

export const handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...JSON_HEADERS, Allow: 'POST' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  if (bookingMode() !== 'request_only') {
    return json(503, { error: 'Registration requests are temporarily unavailable.' })
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

    if (validated.requestedAction === 'waitlist') {
      const saved = await saveWaitlistRequest(db, validated)
      if (!saved.duplicate) {
        await sendAcknowledgements({
          registration: validated.registration,
          program: saved.program,
          session: saved.session,
          reference: saved.reference,
          isWaitlist: true,
          packageSnapshot: saved.packageSnapshot,
        })
      }
      return json(201, { reference: saved.reference, requestedAction: 'waitlist' })
    }

    const saved = await saveEnrollmentRequest(db, validated)
    if (!saved.duplicate) {
      await sendAcknowledgements({
        registration: validated.registration,
        program: saved.program,
        session: saved.session,
        reference: saved.reference,
        isWaitlist: false,
        packageSnapshot: saved.packageSnapshot,
        paymentPreferenceSnapshot: saved.paymentPreferenceSnapshot,
      })
    }

    return json(201, {
      registrationNumber: saved.reference,
      requestedAction: 'enrollment',
    })
  } catch (error) {
    if (error instanceof RequestRejectedError) {
      return json(error.statusCode, { error: error.message })
    }
    console.error('submit-enrollment-request failed:', error)
    return json(500, { error: 'We could not save your request. Please try again or contact Kriana Tutoring.' })
  }
}
