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

export const REGISTRATION_STATUS = {
  STARTED: 'Started',
  PENDING_PAYMENT: 'Pending Payment',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  WAITLISTED: 'Waitlisted',
  EXPIRED: 'Expired',
}

export const PAYMENT_STATUS = {
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

export async function getPrograms({ activeOnly = false } = {}) {
  const snap = await getDocs(collection(db, 'programs'))
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
  const filtered = activeOnly ? all.filter(p => p.isActive) : all
  return filtered.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0
    const tb = b.createdAt?.toMillis?.() ?? 0
    return tb - ta
  })
}

export async function getProgram(programId: string) {
  const snap = await getDoc(doc(db, 'programs', programId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as any
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function getActiveSessions(programId: string) {
  const q = query(collection(db, 'sessions'), where('programId', '==', programId))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((s: any) => s.status === SESSION_STATUS.ACTIVE || s.status === SESSION_STATUS.SOLD_OUT)
    .sort((a: any, b: any) => {
      const ta = a.startDateTime?.toMillis?.() ?? 0
      const tb = b.startDateTime?.toMillis?.() ?? 0
      return ta - tb
    }) as any[]
}

export async function getSession(sessionId: string) {
  const snap = await getDoc(doc(db, 'sessions', sessionId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as any
}

export function getAvailableSeats(session: any) {
  return Math.max(0, (session.capacity ?? 0) - (session.confirmedCount ?? 0))
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
  const d = typeof dt === 'string' ? new Date(dt) : dt?.toDate ? dt.toDate() : new Date(dt)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Toronto', dateStyle: 'medium' })
}

export function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    [REGISTRATION_STATUS.CONFIRMED]: 'bg-green-100 text-green-700',
    [REGISTRATION_STATUS.PENDING_PAYMENT]: 'bg-yellow-100 text-yellow-700',
    [REGISTRATION_STATUS.STARTED]: 'bg-blue-100 text-blue-700',
    [REGISTRATION_STATUS.CANCELLED]: 'bg-red-100 text-red-600',
    [REGISTRATION_STATUS.REFUNDED]: 'bg-purple-100 text-purple-700',
    [REGISTRATION_STATUS.WAITLISTED]: 'bg-orange-100 text-orange-700',
    [REGISTRATION_STATUS.EXPIRED]: 'bg-slate-100 text-slate-500',
    [PAYMENT_STATUS.PAID]: 'bg-green-100 text-green-700',
    [PAYMENT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-700',
    [PAYMENT_STATUS.FAILED]: 'bg-red-100 text-red-600',
    [SESSION_STATUS.ACTIVE]: 'bg-green-100 text-green-700',
    [SESSION_STATUS.SOLD_OUT]: 'bg-red-100 text-red-600',
    [SESSION_STATUS.DRAFT]: 'bg-slate-100 text-slate-500',
    [SESSION_STATUS.CANCELLED]: 'bg-red-100 text-red-600',
  }
  return map[status] ?? 'bg-slate-100 text-slate-600'
}
