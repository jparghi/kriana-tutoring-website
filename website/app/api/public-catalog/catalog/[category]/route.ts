import { NextResponse } from 'next/server'
import { getAdminDb } from '../../../../../netlify/functions/_lib/firebase-admin.js'
import { buildCatalog, CACHE_HEADERS } from '../../_lib'

export async function GET(_request: Request, { params }: { params: { category: string } }) {
  const { category } = params
  const db = getAdminDb()
  return NextResponse.json(
    await buildCatalog(db, decodeURIComponent(category)),
    { headers: CACHE_HEADERS },
  )
}
