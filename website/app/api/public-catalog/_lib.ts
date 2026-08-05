import type { Firestore } from 'firebase-admin/firestore'
import {
  publicProgram,
  publicOffering,
  publicLegacySession,
} from '../../../netlify/functions/get-public-catalog.js'

export function validId(value: string | null) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,150}$/.test(value)
}

export function programUsesOfferings(program: any) {
  return program.bookingModel === 'programOfferings'
    || (Number.isSafeInteger(program.offeringModelVersion) && program.offeringModelVersion >= 1)
}

export async function loadProgram(db: Firestore, programId: string | null): Promise<any> {
  if (!validId(programId)) return null
  return publicProgram(await db.collection('programs').doc(programId as string).get())
}

export async function offeringsForProgram(db: Firestore, program: any) {
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

export async function buildCatalog(db: Firestore, category?: string | null) {
  const snapshot = await db.collection('programs')
    .where('isActive', '==', true)
    .where('publicCatalogVersion', '==', 1)
    .get()
  let programs = snapshot.docs.map(publicProgram).filter(Boolean) as any[]
  if (category) programs = programs.filter(p => p.category === category)

  const offeringsByProgram: Record<string, any[]> = {}
  await Promise.all(programs.map(async p => {
    offeringsByProgram[p.id] = await offeringsForProgram(db, p)
  }))

  return { programs, offeringsByProgram }
}

export { publicProgram, publicOffering, publicLegacySession }

// Catalogue data changes only through staff admin actions, never from public
// traffic, so a short cache window is safe here — UNLIKE the old shared
// ?resource= query-string endpoint this replaces, every resource type below
// lives on its own distinct URL path, so there is no risk of one lookup's
// cache entry being served for a different lookup (the bug that broke
// enrollment site-wide when caching was first added to a single shared path).
export const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
export const NO_STORE = { 'Cache-Control': 'no-store' }
