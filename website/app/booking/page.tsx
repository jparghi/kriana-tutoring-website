import { BookingCatalog } from '../../components/booking/BookingCatalog'
import { getCatalogServer } from '../../lib/catalog.server'

// Regenerate the cached page at most once a minute, matching the public
// catalogue API's own Cache-Control window (see CACHE_HEADERS in
// app/api/public-catalog/_lib.ts) — fresh enough for staff schedule changes
// to show up quickly, but most visitors get an instantly-served cached page
// with real program data instead of a blank grid that fills in after a
// client-side fetch.
export const revalidate = 60

export default async function BookingPage() {
  const catalogData = await getCatalogServer({ activeOnly: true })
  return <BookingCatalog initialData={catalogData} />
}
