// Parent / Guardian Photo & Media Consent — public submission endpoint for
// /demo/consent (the digital replacement for the paper Young Engineers form).
//
// Storage: one `mediaConsents` doc per submission, never overwritten. A
// "subject" is one child at one event under one parent email (subjectKey).
// When the same subject submits again, the new doc becomes isLatest: true and
// every earlier doc for that subject is flipped to isLatest: false with
// supersededById — so staff verify by filtering isLatest == true, and the full
// history stays as the audit trail.
//
// Event consents (/demo/consent) and the general consent (/consent,
// eventId 'general') share this collection; each is its own subject.
//
// YES and NO are stored identically; consent is never a condition of
// attending, and nothing here checks registration status.
import crypto from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './_lib/firebase-admin.js'
import { RequestRejectedError, enforceRateLimit } from './submit-enrollment-request.js'
import {
  MEDIA_CONSENT_ACKNOWLEDGEMENT,
  MEDIA_CONSENT_CHOICES,
  MEDIA_CONSENT_STATEMENT,
  MEDIA_CONSENT_VERSION,
  mediaConsentContext,
  mediaConsentSubjectParts,
  validateMediaConsentPayload,
} from '../../lib/media-consent.js'

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}
const MAX_BODY_BYTES = 10 * 1024

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) }
}

export function mediaConsentSubjectKey(consent) {
  return crypto.createHash('sha256').update(mediaConsentSubjectParts(consent).join('|')).digest('hex')
}

export async function saveMediaConsent(db, consent, clientRequestId, { userAgent = '' } = {}) {
  const event = mediaConsentContext(consent.eventId)
  const subjectKey = mediaConsentSubjectKey(consent)
  const collection = db.collection('mediaConsents')
  const consentRef = collection.doc()
  const session = event.sessions.find(item => item.id === consent.sessionId)

  return db.runTransaction(async tx => {
    // Every read happens before the first write (Firestore transaction rule).
    const current = await tx.get(collection.where('subjectKey', '==', subjectKey).where('isLatest', '==', true))

    // A double-tap / retry of the same form submission — return what we saved.
    const retried = current.docs.find(document => document.data().clientRequestId === clientRequestId)
    if (retried) return { id: retried.id, revision: retried.data().revision, duplicate: true }

    const previousRevision = current.docs.reduce(
      (max, document) => Math.max(max, Number(document.data().revision) || 0),
      0,
    )
    const revision = previousRevision + 1

    for (const document of current.docs) {
      tx.update(collection.doc(document.id), {
        isLatest: false,
        supersededById: consentRef.id,
        supersededAt: FieldValue.serverTimestamp(),
      })
    }

    tx.create(consentRef, {
      schemaVersion: 1,
      eventId: consent.eventId,
      eventSnapshot: {
        title: event.title,
        date: event.date ?? null,
        address: event.address ?? null,
        operatedBy: event.operatedBy,
        franchisee: event.franchisee,
      },
      sessionId: consent.sessionId,
      sessionLabel: session?.label ?? (event.sessions.length > 0 ? 'Not sure / not specified' : null),
      programName: consent.programName || null,
      parentName: consent.parentName,
      childName: consent.childName,
      parentEmail: consent.parentEmail,
      parentPhone: consent.parentPhone,
      mediaConsent: consent.choice,
      photoPermissionGranted: consent.choice === 'YES',
      signature: { typedName: consent.signature, method: 'typed-name' },
      consentVersion: MEDIA_CONSENT_VERSION,
      // Exactly what the parent read and chose, frozen with the response.
      consentTextSnapshot: {
        statement: MEDIA_CONSENT_STATEMENT,
        acknowledgement: MEDIA_CONSENT_ACKNOWLEDGEMENT,
        choice: `${MEDIA_CONSENT_CHOICES[consent.choice].label} ${MEDIA_CONSENT_CHOICES[consent.choice].detail}`,
      },
      subjectKey,
      isLatest: true,
      revision,
      supersedesIds: current.docs.map(document => document.id),
      supersededById: null,
      clientRequestId,
      userAgent: String(userAgent).slice(0, 300),
      submittedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    })

    return { id: consentRef.id, revision, duplicate: false }
  })
}

export const handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...JSON_HEADERS, Allow: 'POST' }, body: JSON.stringify({ error: 'Method Not Allowed' }) }
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

  const validated = validateMediaConsentPayload(body)
  // Bots get a normal-looking success and no signal.
  if (validated.honeypotTriggered) return json(201, { received: true })
  if (validated.error) return json(400, { error: validated.error })

  try {
    const db = getAdminDb()
    if (!await enforceRateLimit(db, event)) {
      return json(429, { error: 'Too many requests. Please wait a few minutes and try again.' })
    }

    const saved = await saveMediaConsent(db, validated.consent, validated.clientRequestId, {
      userAgent: event.headers?.['user-agent'],
    })
    return json(201, { received: true, updatedPrevious: saved.revision > 1 })
  } catch (error) {
    if (error instanceof RequestRejectedError) {
      return json(error.statusCode, { error: error.message })
    }
    console.error('submit-media-consent failed:', error)
    return json(500, { error: 'We could not save your consent response. Please try again or contact Kriana Tutoring.' })
  }
}
