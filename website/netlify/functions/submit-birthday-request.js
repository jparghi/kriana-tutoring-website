import crypto from 'node:crypto'
import nodemailer from 'nodemailer'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'
import { RequestRejectedError, enforceRateLimit } from './submit-enrollment-request.js'
import { emailSignatureHtml } from './_lib/email-signature.js'
import { applyProgramDiscount } from '../../lib/pricing.js'

const BIRTHDAY_CATEGORY = 'Birthday Party'
const MAX_PARTICIPATING_CHILDREN_INCLUDED = 8

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}
const MAX_BODY_BYTES = 20 * 1024

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

function todayInToronto() {
  // en-CA formats as YYYY-MM-DD, which sorts/compares lexicographically the
  // same as it compares chronologically — no Date parsing/timezone math needed.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

function isValidCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function validatePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Invalid request body.' }
  }

  // Honeypot: real visitors never populate this hidden field. Bots that
  // autofill every input do. Treated as a normal-looking validation failure
  // upstream (the handler returns a generic success) so bots get no signal.
  if (normalizeText(body.website, 200)) {
    return { honeypotTriggered: true }
  }

  const programId = normalizeText(body.programId, 150)
  const clientRequestId = normalizeText(body.clientRequestId, 100)

  if (!programId || programId.includes('/')) {
    return { error: 'A birthday program reference is required.' }
  }
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(clientRequestId)) {
    return { error: 'Request identifier is invalid.' }
  }

  const request = {
    parentName: normalizeText(body.parentName, 120),
    parentEmail: normalizeText(body.parentEmail, 254).toLowerCase(),
    parentPhone: normalizeText(body.parentPhone, 40),
    childName: normalizeText(body.childName, 120),
    childAge: Number(String(body.childAge ?? '').trim()),
    preferredDate: normalizeText(body.preferredDate, 10),
    preferredStartTime: normalizeText(body.preferredStartTime, 5),
    alternateDate: normalizeText(body.alternateDate, 10),
    alternateStartTime: normalizeText(body.alternateStartTime, 5),
    partyLocation: normalizeText(body.partyLocation, 300),
    expectedChildCount: Number(String(body.expectedChildCount ?? '').trim()),
    notes: normalizeMultiline(body.notes, 1500),
    accessibilityNotes: normalizeMultiline(body.accessibilityNotes, 1500),
    consentAccepted: body.consentAccepted === true,
  }

  if (request.parentName.length < 2) return { error: 'Please enter the parent or guardian name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.parentEmail)) return { error: 'Please enter a valid email address.' }
  if (request.parentPhone.replace(/\D/g, '').length < 7) return { error: 'Please enter a valid phone number.' }
  if (request.childName.length < 2) return { error: "Please enter the birthday child's name." }
  if (!Number.isInteger(request.childAge) || request.childAge < 1 || request.childAge > 17) {
    return { error: "Please enter the birthday child's age between 1 and 17." }
  }
  if (!isValidCalendarDate(request.preferredDate)) return { error: 'Please enter a valid preferred party date.' }
  if (request.preferredDate < todayInToronto()) return { error: 'Preferred party date cannot be in the past.' }
  if (!isValidTime(request.preferredStartTime)) return { error: 'Please enter a valid preferred start time.' }
  if (request.alternateDate) {
    if (!isValidCalendarDate(request.alternateDate)) return { error: 'Please enter a valid alternate date.' }
    if (request.alternateDate < todayInToronto()) return { error: 'Alternate date cannot be in the past.' }
  }
  if (request.alternateStartTime && !isValidTime(request.alternateStartTime)) {
    return { error: 'Please enter a valid alternate start time.' }
  }
  if (!request.partyLocation || request.partyLocation.length < 3) {
    return { error: 'Please enter the party location or venue details.' }
  }
  if (!Number.isInteger(request.expectedChildCount) || request.expectedChildCount < 1 || request.expectedChildCount > 100) {
    return { error: 'Please enter a valid expected number of participating children.' }
  }
  if (!request.consentAccepted) {
    return { error: 'Please confirm you understand this is an availability request, not a confirmed booking.' }
  }

  return { programId, clientRequestId, request }
}

export function validateProgram(programDoc) {
  if (!programDoc.exists) {
    throw new RequestRejectedError(404, 'This birthday experience is no longer available.')
  }
  const program = programDoc.data()
  if (program.isActive !== true || program.publicCatalogVersion !== 1 || program.category !== BIRTHDAY_CATEGORY) {
    throw new RequestRejectedError(409, 'This birthday experience is not currently accepting requests. Please contact us.')
  }
  return program
}

export function requiresCapacityReview(expectedChildCount) {
  return expectedChildCount > MAX_PARTICIPATING_CHILDREN_INCLUDED
}

export function priceSnapshot(program) {
  const regularPriceCentsSnapshot = Number.isFinite(Number(program.price)) ? Math.max(0, Math.round(Number(program.price))) : 0
  const discount = applyProgramDiscount(regularPriceCentsSnapshot, program)
  return {
    regularPriceCentsSnapshot,
    launchPriceCentsSnapshot: discount.finalCents,
    promotionLabelSnapshot: discount.active ? discount.label : '',
    currency: program.currency || 'CAD',
  }
}

export function idempotencyDigest(programId, request, clientRequestId) {
  return crypto.createHash('sha256')
    .update(`${programId}|${request.preferredDate}|${request.preferredStartTime}|${clientRequestId}`)
    .digest('hex')
}

function activeIdempotencyRecord(snapshot) {
  if (!snapshot?.exists) return null
  const data = snapshot.data()
  const expiresAt = data.expiresAt?.toMillis?.() || 0
  return expiresAt > Date.now() ? data : null
}

async function saveBirthdayRequest(db, programId, request, clientRequestId) {
  const programRef = db.collection('programs').doc(programId)
  const requestRef = db.collection('birthdayPartyRequests').doc()
  const digest = idempotencyDigest(programId, request, clientRequestId)
  const requestKeyRef = db.collection('birthdayRequestKeys').doc(digest)

  return db.runTransaction(async tx => {
    const requestKey = await tx.get(requestKeyRef)
    const duplicate = activeIdempotencyRecord(requestKey)
    if (duplicate) {
      return { id: duplicate.requestId, requestNumber: duplicate.requestNumber, duplicate: true }
    }

    const programDoc = await tx.get(programRef)
    const program = validateProgram(programDoc)

    const year = new Date().getFullYear()
    const counterRef = db.collection('counters').doc(`BD-${year}`)
    const counter = await tx.get(counterRef)
    const previousSequence = counter.exists ? Number(counter.data().seq) : 0
    if (!Number.isSafeInteger(previousSequence) || previousSequence < 0) {
      throw new RequestRejectedError(409, 'The birthday request number sequence requires staff review. Please contact us.')
    }
    const nextSequence = previousSequence + 1
    const requestNumber = `BD-${year}-${String(nextSequence).padStart(4, '0')}`

    const capacityReview = requiresCapacityReview(request.expectedChildCount)
    const pricing = priceSnapshot(program)

    tx.set(counterRef, { seq: nextSequence, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    tx.create(requestRef, {
      schemaVersion: 1,
      requestNumber,
      status: 'Pending Review',
      programId,
      programTitleSnapshot: program.title || '',
      ...pricing,
      parentName: request.parentName,
      parentEmail: request.parentEmail,
      parentPhone: request.parentPhone,
      childName: request.childName,
      childAge: request.childAge,
      preferredDate: request.preferredDate,
      preferredStartTime: request.preferredStartTime,
      alternateDate: request.alternateDate || null,
      alternateStartTime: request.alternateStartTime || null,
      partyLocation: request.partyLocation,
      expectedChildCount: request.expectedChildCount,
      requiresCapacityReview: capacityReview,
      notes: request.notes,
      accessibilityNotes: request.accessibilityNotes,
      consentAccepted: true,
      consentVersion: 'birthday-request-v1',
      source: 'website',
      idempotencyKey: digest,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    tx.set(requestKeyRef, {
      requestId: requestRef.id,
      requestNumber,
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: FieldValue.serverTimestamp(),
    })

    return { id: requestRef.id, requestNumber, duplicate: false, program, requiresCapacityReview: capacityReview, pricing }
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

function formatAmount(cents, currency) {
  return `$${(Number(cents ?? 0) / 100).toFixed(2)} ${currency || 'CAD'}`
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

async function sendAcknowledgements({ request, program, requestNumber, requiresCapacityReview, pricing }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Birthday request saved; SMTP credentials are not configured, so email was skipped.')
    return
  }

  const programTitle = escapeHtml(program.title || 'Young Engineers Birthday Experience')
  const parentName = escapeHtml(request.parentName)
  const childName = escapeHtml(request.childName)
  const safeReference = escapeHtml(requestNumber)
  const fromAddress = `"Kriana Tutoring" <${process.env.SMTP_USER}>`
  const adminEmail = process.env.ADMIN_EMAIL || 'info@krianatutoring.com'

  const parentHtml = `
    <div style="max-width:600px;margin:24px auto;font-family:Arial,sans-serif;color:#1e293b">
      <div style="background:#ED174B;color:white;padding:28px;border-radius:16px 16px 0 0">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase">Kriana Tutoring</p>
        <h1 style="margin:0;font-size:24px">Birthday availability request received</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:0;padding:28px;border-radius:0 0 16px 16px">
        <p>Hi ${parentName},</p>
        <p>We received your availability request for <strong>${childName}'s</strong> birthday — <strong>${programTitle}</strong>.</p>
        <div style="background:#f8fafc;padding:16px;border-radius:10px;margin:18px 0">
          <p style="margin:0 0 8px"><strong>Preferred date:</strong> ${escapeHtml(request.preferredDate)} at ${escapeHtml(request.preferredStartTime)}</p>
          <p style="margin:0"><strong>Reference:</strong> ${safeReference}</p>
        </div>
        <p><strong>Your preferred date is not confirmed yet.</strong> Our team will review availability and contact you with the next steps and payment details. No payment is due now.</p>
        <p>Questions? Reply to this email or call <a href="tel:+16134006921">(613) 400-6921</a>.</p>
        ${emailSignatureHtml()}
      </div>
    </div>`

  const adminHtml = `
    <h2>New birthday availability request</h2>
    <p><strong>Reference:</strong> ${safeReference}</p>
    <p><strong>Program:</strong> ${programTitle} — ${formatAmount(pricing.launchPriceCentsSnapshot, pricing.currency)} (regular ${formatAmount(pricing.regularPriceCentsSnapshot, pricing.currency)})</p>
    <p><strong>Preferred:</strong> ${escapeHtml(request.preferredDate)} at ${escapeHtml(request.preferredStartTime)}</p>
    ${request.alternateDate ? `<p><strong>Alternate:</strong> ${escapeHtml(request.alternateDate)} at ${escapeHtml(request.alternateStartTime || 'n/a')}</p>` : ''}
    <p><strong>Child:</strong> ${childName} (age ${escapeHtml(request.childAge)})</p>
    <p><strong>Expected children:</strong> ${escapeHtml(request.expectedChildCount)}${requiresCapacityReview ? ' — <strong>requires staff review (over 8)</strong>' : ''}</p>
    <p><strong>Parent:</strong> ${parentName} · ${escapeHtml(request.parentEmail)} · ${escapeHtml(request.parentPhone)}</p>
    <p>Review the full request, including location and notes, in the program management portal.</p>`

  const transport = createTransport()
  const results = await Promise.allSettled([
    transport.sendMail({ from: fromAddress, to: request.parentEmail, subject: `Birthday availability request received — ${program.title || 'Kriana Tutoring'}`, html: parentHtml }),
    transport.sendMail({ from: fromAddress, to: adminEmail, subject: `New birthday request — ${program.title || 'Program'} — ${request.childName}`, html: adminHtml }),
  ])
  for (const result of results) {
    if (result.status === 'rejected') console.error('Birthday request acknowledgement email failed:', result.reason)
  }
}

export const handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...JSON_HEADERS, Allow: 'POST' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  if (bookingMode() !== 'request_only') {
    return json(503, { error: 'Birthday availability requests are temporarily unavailable.' })
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
  // A triggered honeypot returns the same success shape a real submission
  // would, without touching Firestore, rate limits, or logs — bots get no
  // signal that anything was different.
  if (validated.honeypotTriggered) return json(201, { requestNumber: 'received' })
  if (validated.error) return json(400, { error: validated.error })

  try {
    const db = getAdminDb()
    if (!await enforceRateLimit(db, event)) {
      return json(429, { error: 'Too many requests. Please wait a few minutes and try again.' })
    }

    const saved = await saveBirthdayRequest(db, validated.programId, validated.request, validated.clientRequestId)
    if (!saved.duplicate) {
      await sendAcknowledgements({
        request: validated.request,
        program: saved.program,
        requestNumber: saved.requestNumber,
        requiresCapacityReview: saved.requiresCapacityReview,
        pricing: saved.pricing,
      })
    }

    return json(201, {
      requestNumber: saved.requestNumber,
      requiresCapacityReview: Boolean(saved.requiresCapacityReview),
    })
  } catch (error) {
    if (error instanceof RequestRejectedError) {
      return json(error.statusCode, { error: error.message })
    }
    console.error('submit-birthday-request failed:', error)
    return json(500, { error: 'We could not save your request. Please try again or contact Kriana Tutoring.' })
  }
}
