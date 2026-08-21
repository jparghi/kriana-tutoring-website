// Server-only campaign config for the dedicated /demo marketing funnel
// (see app/demo/page.tsx). Resolves the ONE program+offering /demo points
// at from env vars — never via .find()/first-match against Firestore — and
// fails closed (an 'unconfigured'/'unavailable' status, never a throw that
// crashes the page) when the campaign isn't set up or the offering isn't
// currently valid to register for.
//
// Kept in a .server.js file (not the plain .js used by the client-safe
// lib/demo-eligibility.js) because it imports firebase-admin and must never
// be pulled into a client bundle.
import { getAdminDb } from '../netlify/functions/_lib/firebase-admin.js'
import { validateDemoCatalogueRequest } from '../netlify/functions/submit-demo-registration.js'
import { RequestRejectedError } from '../netlify/functions/submit-enrollment-request.js'

export function getDemoCampaignConfig() {
  const programId = process.env.DEMO_CAMPAIGN_PROGRAM_ID || ''
  const offeringId = process.env.DEMO_CAMPAIGN_OFFERING_ID || ''
  if (!programId || !offeringId) return null
  return { programId, offeringId }
}

// Reuses validateDemoCatalogueRequest — the same authoritative check
// submit-demo-registration.js runs at registration time — as the single
// source of truth for "valid, published, open" so /demo can never drift
// from what the registration endpoint itself will accept.
//
// `db` is injectable purely for tests/demo-campaign.test.mjs — ESM module
// namespaces are frozen, so getAdminDb can't be monkey-patched from outside
// like a CommonJS export. Resolved lazily (not as a default-parameter
// expression) so the 'unconfigured' short-circuit below never needs real
// Firebase Admin credentials to be present.
export async function resolveDemoCampaignOffering(db) {
  const config = getDemoCampaignConfig()
  if (!config) return { status: 'unconfigured' }
  if (!db) db = getAdminDb()

  const programRef = db.collection('programs').doc(config.programId)
  const offeringRef = db.collection('programOfferings').doc(config.offeringId)
  const [programDoc, offeringDoc] = await Promise.all([programRef.get(), offeringRef.get()])

  try {
    const { program, offering } = validateDemoCatalogueRequest(
      { programId: config.programId, demoOfferingId: config.offeringId },
      programDoc,
      offeringDoc,
    )
    return { status: 'open', programId: config.programId, offeringId: config.offeringId, program, offering }
  } catch (error) {
    if (!(error instanceof RequestRejectedError)) throw error

    // validateDemoCatalogueRequest collapses "full" and "not open" into one
    // generic 409 — re-derive just enough from the raw offering doc to show
    // distinct copy for full vs. closed vs. generically unavailable.
    const offering = offeringDoc.exists ? offeringDoc.data() : null
    if (offering) {
      const capacity = Number(offering.capacity ?? 0)
      const seatsLeft = capacity - Number(offering.confirmedCount ?? 0) - Number(offering.heldCount ?? 0)
      if (offering.status === 'Full' || seatsLeft <= 0) return { status: 'full' }

      const closesAt = offering.enrollmentCloseAt?.toMillis?.()
        ?? new Date(offering.enrollmentCloseAt ?? 0).getTime()
      if (Number.isFinite(closesAt) && closesAt < Date.now()) return { status: 'closed' }
    }
    return { status: 'unavailable' }
  }
}
