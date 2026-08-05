import { NextResponse } from 'next/server'
import { getAdminDb } from '../../../../netlify/functions/_lib/firebase-admin.js'
import { buildCatalog, CACHE_HEADERS } from '../_lib'

export async function GET() {
  const db = getAdminDb()
  return NextResponse.json(await buildCatalog(db), { headers: CACHE_HEADERS })
}
