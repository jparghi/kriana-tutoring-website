import { getAdminDb } from '../netlify/functions/_lib/firebase-admin.js'
import { buildCatalog } from '../app/api/public-catalog/_lib'
import { normalizeCatalogPayload } from './booking'

/**
 * Server Component equivalent of getProgramsWithOfferings — fetches the
 * catalogue directly via the Admin SDK (no HTTP round trip to our own API)
 * so pages like /robotics and /booking can render with real data in their
 * first response instead of a client-side fetch-after-hydrate waterfall.
 * Goes through the same normalizeCatalogPayload as the client path, so the
 * shape callers get is identical either way.
 */
export async function getCatalogServer({ category, activeOnly = false }: { category?: string; activeOnly?: boolean } = {}) {
  const db = getAdminDb()
  const payload = await buildCatalog(db, category)
  return normalizeCatalogPayload(payload, { activeOnly })
}
