import { NextResponse } from 'next/server'
import { getAdminDb } from '../../../../../netlify/functions/_lib/firebase-admin.js'
import { loadProgram, offeringsForProgram, CACHE_HEADERS, NO_STORE } from '../../_lib'

export async function GET(_request: Request, { params }: { params: { programId: string } }) {
  const db = getAdminDb()
  const program = await loadProgram(db, decodeURIComponent(params.programId))
  if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404, headers: NO_STORE })
  return NextResponse.json({ offerings: await offeringsForProgram(db, program) }, { headers: CACHE_HEADERS })
}
