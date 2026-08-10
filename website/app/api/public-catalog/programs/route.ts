import { NextResponse } from 'next/server'
import { getAdminDb } from '../../../../netlify/functions/_lib/firebase-admin.js'
import { publicProgram, CACHE_HEADERS } from '../_lib'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = getAdminDb()
  const snapshot = await db.collection('programs')
    .where('isActive', '==', true)
    .where('publicCatalogVersion', '==', 1)
    .get()
  return NextResponse.json(
    { programs: snapshot.docs.map(publicProgram).filter(Boolean) },
    { headers: CACHE_HEADERS },
  )
}
