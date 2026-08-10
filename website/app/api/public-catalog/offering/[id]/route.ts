import { NextResponse } from 'next/server'
import { getAdminDb } from '../../../../../netlify/functions/_lib/firebase-admin.js'
import {
  validId,
  loadProgram,
  programUsesOfferings,
  publicOffering,
  publicLegacySession,
  CACHE_HEADERS,
  NO_STORE,
} from '../../_lib'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id)
  if (!validId(id)) return NextResponse.json({ error: 'Invalid offering ID' }, { status: 400, headers: NO_STORE })
  const db = getAdminDb()

  const offeringDocument = await db.collection('programOfferings').doc(id).get()
  if (offeringDocument.exists) {
    const offering: any = publicOffering(offeringDocument)
    const program = offering ? await loadProgram(db, offering.programId) : null
    return offering && program
      ? NextResponse.json({ offering }, { headers: CACHE_HEADERS })
      : NextResponse.json({ error: 'Offering not found' }, { status: 404, headers: NO_STORE })
  }

  const legacyDocument = await db.collection('sessions').doc(id).get()
  const legacy: any = legacyDocument.exists ? publicLegacySession(legacyDocument) : null
  const program = legacy ? await loadProgram(db, legacy.programId) : null
  if (!legacy || !program || programUsesOfferings(program) || program.legacyBookingEnabled !== true) {
    return NextResponse.json({ error: 'Offering not found' }, { status: 404, headers: NO_STORE })
  }
  return NextResponse.json({ offering: legacy }, { headers: CACHE_HEADERS })
}
