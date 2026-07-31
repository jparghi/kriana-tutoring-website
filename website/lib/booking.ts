import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, serverTimestamp, limit, orderBy, runTransaction,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROGRAM_CATEGORIES = [
  'Demo Class', 'Robotics', 'Workshop', 'Birthday Party', 'Summer Camp',
  'PA Day Workshop', 'After School', 'Parent & Child', 'Tutoring', 'Other',
]

export const SESSION_STATUS = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  SOLD_OUT: 'Sold Out',
  CANCELLED: 'Cancelled',
}

export const OFFERING_STATUS = {
  OPEN: 'Open',
  FULL: 'Full',
  DRAFT: 'Draft',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
} as const

export type PublicOffering = Record<string, any> & {
  id: string
  offeringId: string
  programId: string
  source: 'programOffering' | 'legacySession'
  status: typeof OFFERING_STATUS.OPEN | typeof OFFERING_STATUS.FULL
  isPublished: boolean
}

export const REGISTRATION_STATUS = {
  STARTED: 'Started',
  PENDING_REVIEW: 'Pending Review',
  PENDING_PAYMENT: 'Pending Payment',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  WAITLISTED: 'Waitlisted',
  EXPIRED: 'Expired',
}

export const PAYMENT_STATUS = {
  NOT_REQUESTED: 'Not Requested',
  NOT_REQUIRED: 'Not Required',
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Partially Refunded',
}

export const PAYMENT_METHOD = {
  STRIPE: 'stripe',
  ETRANSFER: 'etransfer',
}

export const WAITLIST_STATUS = {
  WAITING: 'Waiting',
  OFFERED: 'Offered',
  EXPIRED: 'Expired',
  CONVERTED: 'Converted',
  CANCELLED: 'Cancelled',
}

// ─── Programs ─────────────────────────────────────────────────────────────────

async function catalogRequest(params: Record<string, string>) {
  const queryString = new URLSearchParams(params).toString()
  const response = await fetch(`/.netlify/functions/get-public-catalog?${queryString}`, {
    headers: { Accept: 'application/json' },
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error('Public programme catalogue is temporarily unavailable')
  return response.json()
}

export async function getPrograms({ activeOnly = false } = {}) {
  // The public site never reads Firestore catalogue documents directly. The
  // server returns an explicit safe projection and ignores private/unknown
  // fields even if privileged code accidentally adds one later.
  const payload = await catalogRequest({ resource: 'programs' })
  const all = (payload?.programs ?? []) as any[]
  if (!activeOnly) return all
  return all.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0
    const tb = b.createdAt?.toMillis?.() ?? 0
    return tb - ta
  })
}

export async function getProgram(programId: string) {
  const payload = await catalogRequest({ resource: 'program', id: programId })
  return payload?.program ?? null
}

export function programUsesOfferings(program: any) {
  return program?.bookingModel === 'programOfferings' || Number(program?.offeringModelVersion ?? 0) >= 1
}

// ─── Program offerings ────────────────────────────────────────────────────

function dateValueMillis(value: any) {
  if (!value) return Number.MAX_SAFE_INTEGER
  if (typeof value?.toMillis === 'function') return value.toMillis()
  const millis = new Date(value).getTime()
  return Number.isFinite(millis) ? millis : Number.MAX_SAFE_INTEGER
}

function normalizeOffering(id: string, data: Record<string, any>): PublicOffering {
  const capacity = Number(data.capacity ?? 0)
  const confirmedCount = Number(data.confirmedCount ?? data.enrolledCount ?? 0)
  const heldCount = Number(data.heldCount ?? data.activeHoldCount ?? 0)
  const explicitlyFull = data.status === OFFERING_STATUS.FULL || data.status === SESSION_STATUS.SOLD_OUT
  const fullByCapacity = capacity > 0 && confirmedCount + heldCount >= capacity

  return {
    ...data,
    id,
    offeringId: id,
    programId: String(data.programId ?? ''),
    source: 'programOffering',
    isPublished: data.isPublished === true,
    status: explicitlyFull || fullByCapacity ? OFFERING_STATUS.FULL : OFFERING_STATUS.OPEN,
    title: data.title ?? data.termName ?? data.name ?? 'Weekly Program',
    termName: data.termName ?? data.title ?? data.name ?? '',
    firstClassDate: data.firstClassDate ?? data.startDateTime ?? data.startDate ?? null,
    lastClassDate: data.lastClassDate ?? data.endDateTime ?? data.endDate ?? null,
    startDateTime: data.startDateTime ?? data.firstClassDate ?? data.startDate ?? null,
    endDateTime: data.endDateTime ?? data.lastClassDate ?? data.endDate ?? null,
    weekday: data.weekday ?? data.schedule?.weekday ?? '',
    startTime: data.startTime ?? data.schedule?.startTime ?? '',
    endTime: data.endTime ?? data.schedule?.endTime ?? '',
    classCount: Number(data.classCount ?? data.numberOfClasses ?? data.meetingCount ?? 0),
    capacity,
    confirmedCount,
    heldCount,
    tuitionCents: Number(data.tuitionCents ?? data.priceCents ?? data.tuition?.totalCents ?? 0),
    currency: data.currency ?? data.tuition?.currency ?? 'CAD',
  }
}

function normalizeLegacySession(id: string, data: Record<string, any>): PublicOffering {
  const capacity = Number(data.capacity ?? 0)
  const confirmedCount = Number(data.confirmedCount ?? 0)
  const isFull = data.status === SESSION_STATUS.SOLD_OUT || (capacity > 0 && confirmedCount >= capacity)

  return {
    ...data,
    id,
    offeringId: id,
    programId: String(data.programId ?? ''),
    legacySessionId: id,
    source: 'legacySession',
    isPublished: true,
    status: isFull ? OFFERING_STATUS.FULL : OFFERING_STATUS.OPEN,
    title: data.title ?? 'Program Date',
    termName: data.title ?? '',
    firstClassDate: data.startDateTime ?? null,
    lastClassDate: data.endDateTime ?? null,
    classCount: Number(data.classCount ?? 1),
    capacity,
    confirmedCount,
    heldCount: 0,
    tuitionCents: Number(data.tuitionCents ?? data.priceCents ?? 0),
    currency: data.currency ?? 'CAD',
  }
}

function sortOfferings(offerings: PublicOffering[]) {
  return offerings.sort((a, b) => dateValueMillis(a.firstClassDate) - dateValueMillis(b.firstClassDate))
}

function isValidPublicOffering(offering: PublicOffering) {
  return Boolean(offering.programId)
    && Number.isSafeInteger(offering.capacity)
    && offering.capacity > 0
    && Number.isSafeInteger(offering.confirmedCount)
    && offering.confirmedCount >= 0
    && Number.isSafeInteger(offering.heldCount)
    && offering.heldCount >= 0
    && offering.confirmedCount + offering.heldCount <= offering.capacity
}

async function getLegacyActiveSessions(programId: string) {
  const legacyQuery = query(
    collection(db, 'sessions'),
    where('programId', '==', programId),
    where('legacyPublicBookingVersion', '==', 1),
    where('status', 'in', [SESSION_STATUS.ACTIVE, SESSION_STATUS.SOLD_OUT]),
  )
  const snap = await getDocs(legacyQuery)
  return sortOfferings(snap.docs.map(d => normalizeLegacySession(d.id, d.data())))
}

/** Return public cohorts, with legacy event records as a migration fallback. */
export async function getActiveOfferings(programOrId: string | Record<string, any>) {
  const programId = typeof programOrId === 'string' ? programOrId : programOrId?.id
  if (!programId) return [] as PublicOffering[]
  const payload = await catalogRequest({ resource: 'offerings', programId })
  const offerings = (payload?.offerings ?? []).map((data: any) => (
    data.source === 'legacySession'
      ? normalizeLegacySession(data.id, data)
      : normalizeOffering(data.id, data)
  ))
  return sortOfferings(offerings.filter(isValidPublicOffering))
}

export async function getOffering(offeringId: string) {
  const payload = await catalogRequest({ resource: 'offering', id: offeringId })
  const data = payload?.offering
  if (!data) return null
  const offering = data.source === 'legacySession'
    ? normalizeLegacySession(data.id, data)
    : normalizeOffering(data.id, data)
  return isValidPublicOffering(offering) ? offering : null
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function getActiveSessions(programId: string) {
  const program = await getProgram(programId)
  if (!program) return []
  return (await getActiveOfferings(program)).filter(offering => offering.source === 'legacySession')
}

export async function getSession(sessionId: string) {
  const offering = await getOffering(sessionId)
  return offering?.source === 'legacySession' ? offering : null
}

export function getAvailableSeats(session: any) {
  const capacity = Number(session?.capacity ?? 0)
  if (capacity <= 0) return Number.POSITIVE_INFINITY
  const occupied = Number(session?.confirmedCount ?? session?.enrolledCount ?? 0)
    + Number(session?.heldCount ?? session?.activeHoldCount ?? 0)
  return Math.max(0, capacity - occupied)
}

// ─── Registration numbers ──────────────────────────────────────────────────────

export function registrationPrefixForProgram(program: any) {
  return program?.partnerName ? 'YE' : 'KT'
}

export async function generateRegistrationNumber(prefix: string) {
  const year = new Date().getFullYear()
  const counterRef = doc(db, 'counters', `${prefix}-${year}`)
  const seq = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef)
    const next = (snap.exists() ? snap.data().seq ?? 0 : 0) + 1
    tx.set(counterRef, { seq: next }, { merge: true })
    return next
  })
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`
}

// ─── Registrations ────────────────────────────────────────────────────────────

export async function createRegistration(data: Record<string, any>) {
  const ref = await addDoc(collection(db, 'registrations'), {
    ...data,
    registrationStatus: REGISTRATION_STATUS.STARTED,
    paymentStatus: PAYMENT_STATUS.PENDING,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getRegistration(registrationId: string) {
  const snap = await getDoc(doc(db, 'registrations', registrationId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as any
}

export async function updateRegistration(registrationId: string, data: Record<string, any>) {
  await updateDoc(doc(db, 'registrations', registrationId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export async function addToWaitlist(data: Record<string, any>) {
  const q = query(collection(db, 'waitlist'), where('sessionId', '==', data.sessionId))
  const snap = await getDocs(q)
  const existing = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
  const position = existing.filter(w => w.status === WAITLIST_STATUS.WAITING).length + 1

  const ref = await addDoc(collection(db, 'waitlist'), {
    ...data,
    status: WAITLIST_STATUS.WAITING,
    position,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function formatDateTime(dt: any) {
  if (!dt) return ''
  const d = typeof dt === 'string' ? new Date(dt) : dt?.toDate ? dt.toDate() : new Date(dt)
  return d.toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatDate(dt: any) {
  if (!dt) return ''
  // A bare YYYY-MM-DD is a calendar date, not UTC midnight. Parsing it at noon
  // prevents Toronto timezone conversion from displaying the previous day.
  const d = typeof dt === 'string'
    ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(dt) ? `${dt}T12:00:00` : dt)
    : dt?.toDate ? dt.toDate() : new Date(dt)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Toronto', dateStyle: 'medium' })
}

export function formatTimeOfDay(value: any) {
  if (!value) return ''
  if (typeof value !== 'string') {
    const d = value?.toDate ? value.toDate() : new Date(value)
    return d.toLocaleTimeString('en-CA', {
      timeZone: 'America/Toronto',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const match = value.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return value
  const d = new Date(2000, 0, 1, Number(match[1]), Number(match[2]))
  return d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })
}

export function formatOfferingWeeklySchedule(offering: any) {
  const day = offering?.weekday ? String(offering.weekday) : ''
  const start = formatTimeOfDay(offering?.startTime)
  const end = formatTimeOfDay(offering?.endTime)
  if (day && start && end) return `${day}${day.endsWith('s') ? '' : 's'}, ${start}–${end}`
  if (day && start) return `${day}${day.endsWith('s') ? '' : 's'} at ${start}`
  if (offering?.startDateTime) return formatDateTime(offering.startDateTime)
  return day || 'Schedule to be confirmed'
}

export function formatOfferingDateRange(offering: any) {
  const first = formatDate(offering?.firstClassDate)
  const last = formatDate(offering?.lastClassDate)
  if (first && last && first !== last) return `${first} – ${last}`
  return first || last
}

export function isOfferingSoldOut(offering: any) {
  return offering?.status === OFFERING_STATUS.FULL
    || offering?.status === SESSION_STATUS.SOLD_OUT
    || getAvailableSeats(offering) === 0
}

export function isOfferingRequestWindowOpen(offering: any, now = Date.now()) {
  const hasOpenBoundary = Boolean(offering?.enrollmentOpenAt)
  const hasCloseBoundary = Boolean(offering?.enrollmentCloseAt)
  const opensAt = hasOpenBoundary ? dateValueMillis(offering.enrollmentOpenAt) : null
  const closesAt = hasCloseBoundary ? dateValueMillis(offering.enrollmentCloseAt) : null
  if ((hasOpenBoundary && opensAt === Number.MAX_SAFE_INTEGER)
    || (hasCloseBoundary && closesAt === Number.MAX_SAFE_INTEGER)) return false
  return (opensAt === null || opensAt <= now) && (closesAt === null || closesAt >= now)
}

export function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    [REGISTRATION_STATUS.CONFIRMED]: 'bg-green-100 text-green-700',
    [REGISTRATION_STATUS.PENDING_REVIEW]: 'bg-blue-100 text-blue-700',
    [REGISTRATION_STATUS.PENDING_PAYMENT]: 'bg-yellow-100 text-yellow-700',
    [REGISTRATION_STATUS.STARTED]: 'bg-blue-100 text-blue-700',
    [REGISTRATION_STATUS.CANCELLED]: 'bg-red-100 text-red-600',
    [REGISTRATION_STATUS.REFUNDED]: 'bg-purple-100 text-purple-700',
    [REGISTRATION_STATUS.WAITLISTED]: 'bg-orange-100 text-orange-700',
    [REGISTRATION_STATUS.EXPIRED]: 'bg-slate-100 text-slate-500',
    [PAYMENT_STATUS.PAID]: 'bg-green-100 text-green-700',
    [PAYMENT_STATUS.NOT_REQUESTED]: 'bg-slate-100 text-slate-600',
    [PAYMENT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-700',
    [PAYMENT_STATUS.FAILED]: 'bg-red-100 text-red-600',
    [SESSION_STATUS.ACTIVE]: 'bg-green-100 text-green-700',
    [SESSION_STATUS.SOLD_OUT]: 'bg-red-100 text-red-600',
    [SESSION_STATUS.DRAFT]: 'bg-slate-100 text-slate-500',
    [SESSION_STATUS.CANCELLED]: 'bg-red-100 text-red-600',
    [OFFERING_STATUS.OPEN]: 'bg-green-100 text-green-700',
    [OFFERING_STATUS.FULL]: 'bg-red-100 text-red-600',
  }
  return map[status] ?? 'bg-slate-100 text-slate-600'
}
