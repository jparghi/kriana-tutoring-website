import { NextResponse } from 'next/server'
import { getAdminDb } from '../../../../netlify/functions/_lib/firebase-admin.js'
import { buildCatalog, CACHE_HEADERS } from '../_lib'

// Firestore is the source of truth for schedules. Without this, Next can
// classify this parameterless GET route as static and Netlify may retain the
// generated catalogue long after the response cache window has expired.
export const dynamic = 'force-dynamic'

export async function GET() {
  const db = getAdminDb()
  return NextResponse.json(await buildCatalog(db), { headers: CACHE_HEADERS })
}
