import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, serverTimestamp, limit, orderBy, runTransaction,
} from 'firebase/firestore'
import { db } from './firebase'
import { generateClassSchedule } from './class-schedule.js'

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

// Each resource type below lives on its own distinct URL path (rather than a
// shared path with a `?resource=` query string) so that CDN/edge caching can
// never serve one lookup's cached response for a different lookup — that
// exact collision, when this used a single shared path, once broke
// enrollment site-wide by serving a /catalog response in place of /offerings.
async function catalogRequest(path: string) {
  const response = await fetch(`/api/public-catalog/${path}`, {
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
  const payload = await catalogRequest('programs')
  const all = (payload?.programs ?? []) as any[]
  if (!activeOnly) return all
  return all.sort((a, b) => {
    // Programs with an explicit sortOrder (e.g. the curated Robotics lineup)
    // are shown first, in that order; everything else falls back to newest-first.
    const oa = typeof a.sortOrder === 'number' ? a.sortOrder : Infinity
    const ob = typeof b.sortOrder === 'number' ? b.sortOrder : Infinity
    if (oa !== ob) return oa - ob
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })
}

export async function getProgram(programId: string) {
  const payload = await catalogRequest(`program/${encodeURIComponent(programId)}`)
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
  return offerings.sort((a, b) => {
    const dateDiff = dateValueMillis(a.firstClassDate) - dateValueMillis(b.firstClassDate)
    // Same-term batches (e.g. an earlier/later time slot on the same weekday)
    // share a firstClassDate, so break the tie by time of day — otherwise the
    // later batch can display above the earlier one in an arbitrary order.
    if (dateDiff !== 0) return dateDiff
    return (a.startTime || '').localeCompare(b.startTime || '')
  })
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
  const payload = await catalogRequest(`offerings/${encodeURIComponent(programId)}`)
  const offerings = (payload?.offerings ?? []).map((data: any) => (
    data.source === 'legacySession'
      ? normalizeLegacySession(data.id, data)
      : normalizeOffering(data.id, data)
  ))
  return sortOfferings(offerings.filter(isValidPublicOffering))
}

function normalizeOfferingsPayload(offerings: any[]) {
  const normalized = (offerings ?? []).map((data: any) => (
    data.source === 'legacySession'
      ? normalizeLegacySession(data.id, data)
      : normalizeOffering(data.id, data)
  ))
  return sortOfferings(normalized.filter(isValidPublicOffering))
}

/**
 * Turns a raw `{ programs, offeringsByProgram }` catalogue payload (the same
 * shape /api/public-catalog/catalog returns) into the normalized, sorted
 * shape components render. Pulled out of getProgramsWithOfferings so a
 * server-fetched payload (no HTTP round trip — see lib/catalog.server.ts)
 * goes through the exact same normalization as a client-fetched one.
 */
export function normalizeCatalogPayload(
  payload: { programs?: any[]; offeringsByProgram?: Record<string, any[]> } | null | undefined,
  { activeOnly = false }: { activeOnly?: boolean } = {}
) {
  const programs = (payload?.programs ?? []) as any[]
  const offeringsByProgram: Record<string, PublicOffering[]> = {}
  for (const [programId, offerings] of Object.entries(payload?.offeringsByProgram ?? {})) {
    offeringsByProgram[programId] = normalizeOfferingsPayload(offerings as any[])
  }

  const sorted = !activeOnly ? programs : [...programs].sort((a, b) => {
    const oa = typeof a.sortOrder === 'number' ? a.sortOrder : Infinity
    const ob = typeof b.sortOrder === 'number' ? b.sortOrder : Infinity
    if (oa !== ob) return oa - ob
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })

  return { programs: sorted, offeringsByProgram }
}

/**
 * Programs plus each one's active offerings, fetched in a single request
 * instead of one /programs call followed by one /offerings call per program.
 * Use this anywhere a page renders a list of program cards with schedule
 * badges (e.g. /booking, /robotics) — the old N+1 pattern was the main
 * cause of slow loads on those pages.
 */
export async function getProgramsWithOfferings({ category, activeOnly = false }: { category?: string; activeOnly?: boolean } = {}) {
  const payload = await catalogRequest(category ? `catalog/${encodeURIComponent(category)}` : 'catalog')
  return normalizeCatalogPayload(payload, { activeOnly })
}

export async function getOffering(offeringId: string) {
  const payload = await catalogRequest(`offering/${encodeURIComponent(offeringId)}`)
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

export { applyProgramDiscount } from './pricing.js'

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export type ProgramDiscount = { active: boolean; label: string; finalCents: number }

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

function toDateValue(value: any) {
  if (!value) return null
  return value?.toDate ? value.toDate() : new Date(value)
}

/**
 * Day of week, first-class date, and from–to time — used where a compact
 * weekly-cadence summary (formatOfferingWeeklySchedule) isn't specific
 * enough, e.g. a tooltip. Modern offerings carry weekday/startTime/endTime
 * directly; legacy sessions only have a single startDateTime/endDateTime, so
 * the day/date/time are derived from that.
 */
export function formatOfferingScheduleDetail(offering: any) {
  if (offering?.weekday && offering?.startTime) {
    const day = String(offering.weekday)
    const dayLabel = day.endsWith('s') ? day : `${day}s`
    const start = formatTimeOfDay(offering.startTime)
    const end = formatTimeOfDay(offering.endTime)
    const dateLabel = offering?.firstClassDate ? `, starting ${formatDate(offering.firstClassDate)}` : ''
    return start && end ? `${dayLabel}, ${start}–${end}${dateLabel}` : `${dayLabel}${dateLabel}`
  }

  const start = toDateValue(offering?.startDateTime)
  if (start) {
    const end = toDateValue(offering?.endDateTime)
    const dayLabel = start.toLocaleDateString('en-CA', { timeZone: 'America/Toronto', weekday: 'long' })
    const dateLabel = start.toLocaleDateString('en-CA', { timeZone: 'America/Toronto', month: 'long', day: 'numeric' })
    const startTime = start.toLocaleTimeString('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit' })
    const endTime = end ? end.toLocaleTimeString('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', minute: '2-digit' }) : ''
    return endTime ? `${dayLabel}, ${dateLabel} · ${startTime}–${endTime}` : `${dayLabel}, ${dateLabel} · ${startTime}`
  }

  return 'Schedule to be confirmed'
}

/**
 * The exact weekly class-date schedule for a package on a given offering —
 * skipping Ontario statutory holidays (and any offering-specific closures)
 * so the schedule always contains exactly the package's purchased class
 * count of real class dates, not just "classCount weeks after the first
 * class" (which is wrong whenever a holiday falls on the weekly class day).
 *
 * Returns the same shape as `generateClassSchedule` — an empty schedule
 * (classDates: [], startDate: null, endDate: null) if the offering doesn't
 * carry enough data to compute one; callers should fall back to "Schedule
 * to be confirmed" in that case rather than guessing.
 */
export function getPackageClassSchedule(offering: any, pkg: any) {
  return generateClassSchedule({
    firstClassDate: offering?.firstClassDate ?? null,
    weekday: offering?.weekday ?? '',
    classCount: pkg?.classCount,
    timeZone: offering?.timezone || 'America/Toronto',
    // Offerings may eventually carry their own non-statutory closures
    // (facility closures, one-off cancellations) under either name.
    excludedDates: offering?.excludedDates ?? offering?.closureDates ?? undefined,
  })
}

export function formatOfferingDateRange(offering: any, selectedPackage?: any) {
  if (selectedPackage) {
    const schedule = getPackageClassSchedule(offering, selectedPackage)
    if (schedule.startDate && schedule.endDate) {
      const first = formatDate(schedule.startDate)
      const last = formatDate(schedule.endDate)
      return first && last && first !== last ? `${first} – ${last}` : (first || last)
    }
    // Fall through to the offering's own dates only if we couldn't compute
    // an exact package schedule (e.g. offering data is incomplete) — better
    // than showing nothing, though it may not reflect the package exactly.
  }

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
