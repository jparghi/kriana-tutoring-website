import { NextResponse } from 'next/server'
import { getAdminDb } from '../../../../../netlify/functions/_lib/firebase-admin.js'
import { loadProgram, CACHE_HEADERS, NO_STORE } from '../../_lib'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const db = getAdminDb()
  const program = await loadProgram(db, decodeURIComponent(params.id))
  return program
    ? NextResponse.json({ program }, { headers: CACHE_HEADERS })
    : NextResponse.json({ error: 'Program not found' }, { status: 404, headers: NO_STORE })
}
