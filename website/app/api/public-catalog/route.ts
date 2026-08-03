import { NextRequest, NextResponse } from 'next/server'
import type { Firestore } from 'firebase-admin/firestore'
import { getAdminDb } from '../../../netlify/functions/_lib/firebase-admin.js'
import {
  publicProgram,
  publicOffering,
  publicLegacySession,
} from '../../../netlify/functions/get-public-catalog.js'

function validId(value: string | null) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,150}$/.test(value)
}

function programUsesOfferings(program: any) {
  return program.bookingModel === 'programOfferings'
    || (Number.isSafeInteger(program.offeringModelVersion) && program.offeringModelVersion >= 1)
}

async function loadProgram(db: Firestore, programId: string | null) {
  if (!validId(programId)) return null
  return publicProgram(await db.collection('programs').doc(programId as string).get())
}

async function offeringsForProgram(db: Firestore, program: any) {
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

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const resource = params.get('resource') || ''
  const db = getAdminDb()

  const noStore = { 'Cache-Control': 'no-store' }

  if (resource === 'programs') {
    const snapshot = await db.collection('programs')
      .where('isActive', '==', true)
      .where('publicCatalogVersion', '==', 1)
      .get()
    return NextResponse.json({ programs: snapshot.docs.map(publicProgram).filter(Boolean) })
  }

  if (resource === 'program') {
    const program = await loadProgram(db, params.get('id'))
    return program
      ? NextResponse.json({ program })
      : NextResponse.json({ error: 'Program not found' }, { status: 404, headers: noStore })
  }

  if (resource === 'offerings') {
    const program = await loadProgram(db, params.get('programId'))
    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404, headers: noStore })
    return NextResponse.json({ offerings: await offeringsForProgram(db, program) })
  }

  if (resource === 'offering') {
    const id = params.get('id')
    if (!validId(id)) return NextResponse.json({ error: 'Invalid offering ID' }, { status: 400, headers: noStore })
    const offeringDocument = await db.collection('programOfferings').doc(id as string).get()
    if (offeringDocument.exists) {
      const offering = publicOffering(offeringDocument)
      const program = offering ? await loadProgram(db, offering.programId) : null
      return offering && program
        ? NextResponse.json({ offering })
        : NextResponse.json({ error: 'Offering not found' }, { status: 404, headers: noStore })
    }
    const legacyDocument = await db.collection('sessions').doc(id as string).get()
    const legacy = legacyDocument.exists ? publicLegacySession(legacyDocument) : null
    const program = legacy ? await loadProgram(db, legacy.programId) : null
    if (!legacy || !program || programUsesOfferings(program) || program.legacyBookingEnabled !== true) {
      return NextResponse.json({ error: 'Offering not found' }, { status: 404, headers: noStore })
    }
    return NextResponse.json({ offering: legacy })
  }

  return NextResponse.json({ error: 'Invalid catalogue resource' }, { status: 400, headers: noStore })
}
