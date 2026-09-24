// Parent / Guardian Photo & Media Consent — the digital replacement for the
// paper Young Engineers form. Plain .js (no firebase imports) so the consent
// pages, the submit-media-consent function and node:test all share one source
// for the event details, the consent wording and payload validation.
//
// Two kinds of consent context share one form and one collection:
//   - an event (MEDIA_CONSENT_EVENTS) — /demo/consent, with date, venue and
//     sessions. For a future event add an entry and point
//     CURRENT_MEDIA_CONSENT_EVENT_ID at it.
//   - GENERAL_MEDIA_CONSENT — the evergreen /consent page for any Young
//     Engineers activity, with an optional free-text program/event instead.
// Submissions keep an eventId and an eventSnapshot, so older responses stay
// readable after either changes.

// Bump whenever the statement or option wording changes. Every submission
// stores the version plus the exact text the parent saw.
export const MEDIA_CONSENT_VERSION = 'ye-photo-media-v1'

export const MEDIA_CONSENT_STATEMENT =
  'We would like your permission to use photographs of your child taken during Young Engineers activities for Young Engineers social media and printed promotional materials.'

export const MEDIA_CONSENT_ACKNOWLEDGEMENT =
  'I understand that photographs may be taken of my child during Young Engineers activities. Please indicate my permission below:'

export const MEDIA_CONSENT_CHOICES = Object.freeze({
  YES: {
    label: 'YES — I give permission',
    detail: "for my child's photographs to be used on Young Engineers social media and printed materials.",
  },
  NO: {
    label: 'NO — I do not give permission',
    detail: "for my child's photographs to be used for these purposes.",
  },
})

export const MEDIA_CONSENT_EVENTS = Object.freeze({
  'ye-pd-day-stittsville-2026-10-02': {
    id: 'ye-pd-day-stittsville-2026-10-02',
    title: 'Young Engineers PD Day STEM Workshop',
    dateLabel: 'October 2, 2026',
    date: '2026-10-02',
    venueName: 'Stittsville',
    address: '205 Metric Circle, Stittsville, ON K2V 0L3',
    operatedBy: 'Kriana Tutoring | Young Engineers Kanata',
    franchisee: 'Young Engineers Kanata',
    sessions: [
      { id: 'am', label: 'Morning Workshop (10:30 AM–12:00 PM)' },
      { id: 'pm', label: 'Afternoon Workshop (2:00 PM–3:30 PM)' },
    ],
  },
})

export const CURRENT_MEDIA_CONSENT_EVENT_ID = 'ye-pd-day-stittsville-2026-10-02'

export const GENERAL_MEDIA_CONSENT_ID = 'general'

export const GENERAL_MEDIA_CONSENT = Object.freeze({
  id: GENERAL_MEDIA_CONSENT_ID,
  title: 'Young Engineers activities',
  appliesTo: 'Young Engineers classes, workshops, camps and events',
  operatedBy: 'Kriana Tutoring | Young Engineers Kanata',
  franchisee: 'Young Engineers Kanata',
  sessions: [],
})

/** The event entry, the general context, or null for anything else. */
export function mediaConsentContext(eventId) {
  if (eventId === GENERAL_MEDIA_CONSENT_ID) return GENERAL_MEDIA_CONSENT
  return Object.hasOwn(MEDIA_CONSENT_EVENTS, eventId) ? MEDIA_CONSENT_EVENTS[eventId] : null
}

// 'unknown' is always accepted — the session is "if known".
export const UNKNOWN_SESSION_ID = 'unknown'

function normalizeText(value, maxLength) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

// Case/spacing-insensitive, so "Alex  Smith" and "alex smith" from the same
// parent land on the same subject.
function normalizeKeyPart(value) {
  return normalizeText(value, 254).toLowerCase()
}

/**
 * One consent "subject" = one child at one event, identified by the parent's
 * email. Re-submissions for the same subject supersede the earlier response
 * (which is kept as an audit trail); a sibling gets their own subject.
 */
export function mediaConsentSubjectParts({ eventId, parentEmail, childName }) {
  return [normalizeKeyPart(eventId), normalizeKeyPart(parentEmail), normalizeKeyPart(childName)]
}

/**
 * @returns {{ error: string } | { honeypotTriggered: true } | { consent: object, clientRequestId: string }}
 */
export function validateMediaConsentPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Invalid request body.' }
  }

  // Honeypot: hidden from people, autofilled by bots.
  if (normalizeText(body.website, 200)) return { honeypotTriggered: true }

  const clientRequestId = normalizeText(body.clientRequestId, 100)
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(clientRequestId)) {
    return { error: 'Request identifier is invalid.' }
  }

  const eventId = normalizeText(body.eventId, 100)
  const event = mediaConsentContext(eventId)
  if (!event) return { error: 'This consent form is for an event we do not recognise. Please contact us.' }

  const consent = {
    eventId,
    parentName: normalizeText(body.parentName, 120),
    childName: normalizeText(body.childName, 120),
    parentEmail: normalizeText(body.parentEmail, 254).toLowerCase(),
    parentPhone: normalizeText(body.parentPhone, 40),
    // Only the two explicit answers count — never a default.
    choice: body.choice === 'YES' || body.choice === 'NO' ? body.choice : null,
    signature: normalizeText(body.signature, 120),
    sessionId: normalizeText(body.sessionId, 20) || UNKNOWN_SESSION_ID,
    // General consent only: which program/event the family is with, if they say.
    programName: eventId === GENERAL_MEDIA_CONSENT_ID ? normalizeText(body.programName, 120) : '',
  }

  if (consent.parentName.length < 2) return { error: 'Please enter the parent or guardian name.' }
  if (consent.childName.length < 2) return { error: "Please enter your child's name." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(consent.parentEmail)) return { error: 'Please enter a valid email address.' }
  if (consent.parentPhone.replace(/\D/g, '').length < 7) return { error: 'Please enter a valid phone number.' }
  if (!consent.choice) return { error: 'Please choose YES or NO for photo permission.' }
  if (consent.signature.length < 2) return { error: 'Please type your full name as your signature.' }
  if (consent.sessionId !== UNKNOWN_SESSION_ID && !event.sessions.some(session => session.id === consent.sessionId)) {
    return { error: 'Please choose a valid workshop session.' }
  }

  return { consent, clientRequestId }
}
