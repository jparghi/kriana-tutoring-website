import crypto from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'

// Demo Lead Tracker — the website's half. A demo registration creates its lead
// here, right after the registration transaction commits (see
// submit-demo-registration.js). The tracker UI and every later status change
// live in the portal repo (apps/app/netlify/functions/_lib/demo-lead.js).
//
// KEEP IN SYNC with the portal copy: same schema, statuses, activity types and
// normalizeLeadSource. demoLeads/{registrationId} — the doc id IS the
// registration id, so a registration can never have two leads.

export const LEAD_STATUS = Object.freeze({
  NEW: 'NEW',
  CONFIRMED: 'CONFIRMED',
  REMINDER_SENT: 'REMINDER_SENT',
  ATTENDED: 'ATTENDED',
  NO_SHOW: 'NO_SHOW',
  INTERESTED: 'INTERESTED',
  FOLLOW_UP_NEEDED: 'FOLLOW_UP_NEEDED',
  ENROLLED: 'ENROLLED',
  NOT_READY: 'NOT_READY',
  LOST: 'LOST',
})


const NEWSLETTER_CANDIDATE_STATUSES = new Set([LEAD_STATUS.LOST, LEAD_STATUS.NOT_READY])


export const LEAD_ACTIVITY_TYPE = Object.freeze({
  REGISTRATION_RECEIVED: 'REGISTRATION_RECEIVED',
  ACK_EMAIL_SENT: 'ACK_EMAIL_SENT',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  TIME_CONFIRMED: 'TIME_CONFIRMED',
  CONFIRMATION_EMAIL_SENT: 'CONFIRMATION_EMAIL_SENT',
  ATTENDED: 'ATTENDED',
  NO_SHOW: 'NO_SHOW',
  CANCELLED: 'CANCELLED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  FOLLOW_UP_SET: 'FOLLOW_UP_SET',
  NOTE: 'NOTE',
  ENROLLED: 'ENROLLED',
})

export const LEAD_SOURCES = Object.freeze([
  'Facebook', 'Instagram', 'Google', 'WhatsApp', 'Referral', 'Organic Website', 'Direct', 'Other', 'Unknown',
])


/**
 * Maps the registration's marketingAttribution to one lead source. Never
 * invents attribution: a value that can't be recognised is "Other" only when
 * something was captured, otherwise "Unknown".
 */
export function normalizeLeadSource(attribution) {
  const a = attribution && typeof attribution === 'object' ? attribution : {}
  const source = String(a.source || '').toLowerCase()
  const medium = String(a.medium || '').toLowerCase()
  let referrerHost = ''
  try {
    referrerHost = a.referrer ? new URL(a.referrer).host.toLowerCase() : ''
  } catch {
    referrerHost = ''
  }
  const haystack = `${source} ${referrerHost}`

  if (/instagram|(^|\W)ig(\W|$)|l\.instagram/.test(haystack)) return 'Instagram'
  if (/facebook|(^|\W)fb(\W|$)|fb\.com|meta/.test(haystack)) return 'Facebook'
  if (/whatsapp|wa\.me/.test(haystack)) return 'WhatsApp'
  if (/google/.test(haystack)) return 'Google'
  if (/referral|friend|word/.test(`${source} ${medium}`)) return 'Referral'
  if (/flyer|qr/.test(source)) return 'Other'
  if (source || medium || a.campaign) return 'Other'
  if (referrerHost) return 'Organic Website'
  if (a.landingPath) return 'Direct'
  return 'Unknown'
}


export function buildLeadDoc(input) {
  const status = input.status || LEAD_STATUS.NEW
  const a = input.attribution && typeof input.attribution === 'object' ? input.attribution : {}
  return {
    registrationId: input.registrationId,
    registrationNumber: input.registrationNumber ?? null,
    demoProgramId: input.demoProgramId ?? null,
    demoOfferingId: input.demoOfferingId ?? null,
    // Contact snapshot: kept on the lead so a cancelled/lost lead is still a
    // usable record (future newsletter audience) without joining.
    parentName: input.parentName,
    parentEmail: input.parentEmail,
    parentPhone: input.parentPhone || null,
    childName: input.childName,
    childAge: input.childAge ?? null,
    eventTitle: input.eventTitle ?? null,
    eventStartAt: input.eventStartAt ?? null,
    leadSource: normalizeLeadSource(a),
    campaign: a.campaign ?? null,
    attribution: {
      source: a.source ?? null,
      medium: a.medium ?? null,
      campaign: a.campaign ?? null,
      content: a.content ?? null,
      term: a.term ?? null,
      referrer: a.referrer ?? null,
    },
    leadStatus: status,
    nextAction: null,
    followUpAt: null,
    enrolledAt: null,
    enrolledProgram: null,
    enrolledPackage: null,
    enrollmentOutcome: null,
    lostReason: null,
    newsletterCandidate: NEWSLETTER_CANDIDATE_STATUSES.has(status),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastActivityAt: FieldValue.serverTimestamp(),
  }
}


const ALREADY_EXISTS = 6

/**
 * Creates the lead (and its REGISTRATION_RECEIVED timeline entry) for a
 * just-saved registration. Idempotent: if the lead already exists (a retried
 * request, or the portal created it first) nothing changes. NEVER throws — a
 * lead problem must not fail a registration that is already saved; failures
 * are logged and the portal's backfill script picks up any misses.
 */
export async function createLeadFromRegistration(db, { registrationId, reference, request, program, offering }) {
  try {
    const { registration, marketingAttribution, programId, demoOfferingId } = request
    const leadRef = db.collection('demoLeads').doc(registrationId)
    const batch = db.batch()
    batch.create(leadRef, buildLeadDoc({
      registrationId,
      registrationNumber: reference,
      demoProgramId: programId,
      demoOfferingId,
      parentName: registration.parentName,
      parentEmail: registration.parentEmail,
      parentPhone: registration.parentPhone,
      childName: registration.childName,
      childAge: registration.childAge,
      eventTitle: offering?.eventTitle ?? program?.title ?? null,
      eventStartAt: offering?.eventStartAt ?? null,
      attribution: marketingAttribution,
      status: LEAD_STATUS.NEW,
    }))
    batch.set(db.collection('demoLeadActivities').doc(crypto.randomUUID()), {
      leadId: registrationId,
      type: LEAD_ACTIVITY_TYPE.REGISTRATION_RECEIVED,
      description: `Registration received (${reference})`,
      metadata: {},
      createdAt: FieldValue.serverTimestamp(),
      createdBy: 'system',
    })
    await batch.commit()
    return { created: true }
  } catch (error) {
    if (error?.code === ALREADY_EXISTS || /ALREADY_EXISTS/.test(String(error?.message))) {
      return { created: false }
    }
    console.error('createLeadFromRegistration failed (registration was saved):', error)
    return { created: false, error: true }
  }
}

/** Best-effort timeline entry (e.g. once the acknowledgement email is sent). Never throws. */
export async function logLeadActivity(db, { registrationId, type, description, metadata }) {
  try {
    const leadRef = db.collection('demoLeads').doc(registrationId)
    const snapshot = await leadRef.get()
    if (!snapshot.exists) return
    const batch = db.batch()
    batch.set(db.collection('demoLeadActivities').doc(crypto.randomUUID()), {
      leadId: registrationId,
      type,
      description,
      metadata: metadata || {},
      createdAt: FieldValue.serverTimestamp(),
      createdBy: 'system',
    })
    batch.update(leadRef, { updatedAt: FieldValue.serverTimestamp(), lastActivityAt: FieldValue.serverTimestamp() })
    await batch.commit()
  } catch (error) {
    console.error('logLeadActivity failed (non-fatal):', error)
  }
}
