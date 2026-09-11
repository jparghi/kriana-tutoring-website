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
import { assertLiveDemoOffering, demoPublicBookingState } from '../netlify/functions/submit-demo-registration.js'
import { RequestRejectedError } from '../netlify/functions/submit-enrollment-request.js'

export function getDemoCampaignConfig() {
  const programId = process.env.DEMO_CAMPAIGN_PROGRAM_ID || ''
  const offeringId = process.env.DEMO_CAMPAIGN_OFFERING_ID || ''
  if (!programId || !offeringId) return null
  return { programId, offeringId }
}

// Reuses assertLiveDemoOffering + demoPublicBookingState — the same
// authoritative checks submit-demo-registration.js and
// submit-demo-waitlist.js run at submission time — as the single source of
// truth, so /demo can never drift from what those endpoints will accept.
//
// Returns one of:
//   { status: 'open',   programId, offeringId, program, offering }
//   { status: 'full',   programId, offeringId, program, offering, waitlistOpen }
//   { status: 'closed', programId, offeringId, program, offering }
//   { status: 'unavailable' } | { status: 'unconfigured' }
// 'full' also covers staff pausing public booking (publicRegistrationPaused)
// while seats remain internally; waitlistOpen mirrors the offering's own
// waitlistEnabled switch, exactly what submit-demo-waitlist.js enforces.
//
// `db` is injectable purely for tests/demo-campaign.test.mjs — ESM module
// namespaces are frozen, so getAdminDb can't be monkey-patched from outside
// like a CommonJS export. Resolved lazily (not as a default-parameter
// expression) so the 'unconfigured' short-circuit below never needs real
// Firebase Admin credentials to be present.
/**
 * @typedef {Object} DemoCampaign
 * @property {'open' | 'full' | 'closed' | 'unavailable' | 'unconfigured'} status
 * @property {string} [programId]
 * @property {string} [offeringId]
 * @property {any} [program]
 * @property {any} [offering]
 * @property {boolean} [waitlistOpen] Only meaningful when status is 'full'.
 *
 * @param {any} [db]
 * @returns {Promise<DemoCampaign>}
 */
export async function resolveDemoCampaignOffering(db) {
  const config = getDemoCampaignConfig()
  if (!config) return { status: 'unconfigured' }
  if (!db) db = getAdminDb()

  const programRef = db.collection('programs').doc(config.programId)
  const offeringRef = db.collection('programOfferings').doc(config.offeringId)
  const [programDoc, offeringDoc] = await Promise.all([programRef.get(), offeringRef.get()])

  let live
  try {
    live = assertLiveDemoOffering(
      { programId: config.programId, demoOfferingId: config.offeringId },
      programDoc,
      offeringDoc,
    )
  } catch (error) {
    if (!(error instanceof RequestRejectedError)) throw error
    return { status: 'unavailable' }
  }

  const base = { programId: config.programId, offeringId: config.offeringId, program: live.program, offering: live.offering }
  const state = demoPublicBookingState(live.offering)
  if (state === 'open') return { status: 'open', ...base }
  if (state === 'full') return { status: 'full', ...base, waitlistOpen: live.offering.waitlistEnabled === true }
  if (state === 'closed') return { status: 'closed', ...base }
  return { status: 'unavailable' }
}
