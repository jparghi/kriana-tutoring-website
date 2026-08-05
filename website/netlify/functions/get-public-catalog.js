import { getAdminDb } from './_lib/firebase-admin.js'

const PROGRAM_FIELDS = [
  'title', 'category', 'description', 'partnerName', 'ageRange',
  'gradeRange', 'price', 'depositAmount', 'isDepositOnly',
  'refundPolicyText', 'imageUrl', 'durationMin', 'learnMoreUrl',
  'bookingModel', 'offeringModelVersion', 'legacyBookingEnabled',
  'discountActive', 'discountLabel', 'discountType', 'discountValue',
  'sortOrder', 'createdAt',
]
const OFFERING_FIELDS = [
  'programId', 'title', 'termName', 'location', 'timezone', 'weekday',
  'startTime', 'endTime', 'classCount', 'capacity', 'tuitionCents',
  'currency', 'isPublished', 'waitlistEnabled', 'enrollmentOpenAt',
  'enrollmentCloseAt', 'firstClassDate', 'lastClassDate', 'status',
  'confirmedCount', 'heldCount',
]
const LEGACY_FIELDS = [
  'programId', 'title', 'location', 'startDateTime', 'endDateTime',
  'durationMin', 'capacity', 'confirmedCount', 'waitlistEnabled',
  'status',
]

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': statusCode === 200
        ? 'public, max-age=60, stale-while-revalidate=300'
        : 'no-store',
    },
    body: JSON.stringify(body),
  }
}

function validId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,150}$/.test(value)
}

function jsonValue(value) {
  if (value == null) return value
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  return value
}

function projection(id, data, fields) {
  return {
    id,
    ...Object.fromEntries(fields
      .filter(field => Object.prototype.hasOwnProperty.call(data, field))
      .map(field => [field, jsonValue(data[field])])),
  }
}

export function publicProgram(document) {
  if (!document.exists) return null
  const data = document.data()
  if (data.publicCatalogVersion !== 1 || data.isActive !== true) return null
  return projection(document.id, data, PROGRAM_FIELDS)
}

function validCapacity(data, heldCount = data.heldCount ?? 0) {
  return Number.isSafeInteger(data.capacity) && data.capacity > 0
    && Number.isSafeInteger(data.confirmedCount) && data.confirmedCount >= 0
    && Number.isSafeInteger(heldCount) && heldCount >= 0
    && data.confirmedCount + heldCount <= data.capacity
}

export function publicOffering(document) {
  const data = document.data()
  if (data.publicCatalogVersion !== 1 || data.isPublished !== true
      || !['Open', 'Full'].includes(data.status) || !validCapacity(data)) return null
  return { ...projection(document.id, data, OFFERING_FIELDS), source: 'programOffering', offeringId: document.id }
}

export function publicLegacySession(document) {
  const data = document.data()
  if (data.legacyPublicBookingVersion !== 1
      || !['Active', 'Sold Out'].includes(data.status)
      || !validCapacity(data, 0)) return null
  return {
    ...projection(document.id, data, LEGACY_FIELDS),
    source: 'legacySession', offeringId: document.id, legacySessionId: document.id,
    isPublished: true,
  }
}

function programUsesOfferings(program) {
  return program.bookingModel === 'programOfferings'
    || (Number.isSafeInteger(program.offeringModelVersion) && program.offeringModelVersion >= 1)
}

async function loadProgram(db, programId) {
  if (!validId(programId)) return null
  return publicProgram(await db.collection('programs').doc(programId).get())
}

async function offeringsForProgram(db, program) {
  const snapshot = await db.collection('programOfferings')
    .where('programId', '==', program.id)
    .where('publicCatalogVersion', '==', 1)
    .where('isPublished', '==', true)
    .where('status', 'in', ['Open', 'Full'])
    .get()
  const offerings = snapshot.docs.map(publicOffering).filter(Boolean)
  if (programUsesOfferings(program) || offerings.length > 0) return offerings
  if (program.legacyBookingEnabled !== true) return []

  const legacySnapshot = await db.collection('sessions')
    .where('programId', '==', program.id)
    .where('legacyPublicBookingVersion', '==', 1)
    .where('status', 'in', ['Active', 'Sold Out'])
    .get()
  return legacySnapshot.docs.map(publicLegacySession).filter(Boolean)
}

export const handler = async event => {
  if (event.httpMethod !== 'GET') return response(405, { error: 'Method Not Allowed' })
  const resource = event.queryStringParameters?.resource || ''
  const db = getAdminDb()

  if (resource === 'programs') {
    const snapshot = await db.collection('programs')
      .where('isActive', '==', true)
      .where('publicCatalogVersion', '==', 1)
      .get()
    return response(200, { programs: snapshot.docs.map(publicProgram).filter(Boolean) })
  }

  if (resource === 'program') {
    const program = await loadProgram(db, event.queryStringParameters?.id)
    return program ? response(200, { program }) : response(404, { error: 'Program not found' })
  }

  if (resource === 'offerings') {
    const program = await loadProgram(db, event.queryStringParameters?.programId)
    if (!program) return response(404, { error: 'Program not found' })
    return response(200, { offerings: await offeringsForProgram(db, program) })
  }

  if (resource === 'offering') {
    const id = event.queryStringParameters?.id
    if (!validId(id)) return response(400, { error: 'Invalid offering ID' })
    const offeringDocument = await db.collection('programOfferings').doc(id).get()
    if (offeringDocument.exists) {
      const offering = publicOffering(offeringDocument)
      const program = offering ? await loadProgram(db, offering.programId) : null
      return offering && program ? response(200, { offering }) : response(404, { error: 'Offering not found' })
    }
    const legacyDocument = await db.collection('sessions').doc(id).get()
    const legacy = legacyDocument.exists ? publicLegacySession(legacyDocument) : null
    const program = legacy ? await loadProgram(db, legacy.programId) : null
    if (!legacy || !program || programUsesOfferings(program) || program.legacyBookingEnabled !== true) {
      return response(404, { error: 'Offering not found' })
    }
    return response(200, { offering: legacy })
  }

  return response(400, { error: 'Invalid catalogue resource' })
}
