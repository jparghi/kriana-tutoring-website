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

// The four lifecycle states /demo can present, independent of what the
// offering doc happens to say. Staff normally never set these by hand —
// they're derived from the live offering (see derivePageState) — but
// DEMO_PAGE_STATE can pin one when the data and the story differ, e.g.
// keeping the sold-out celebration up for a week after the event.
export const DEMO_PAGE_STATES = ['waitlist', 'registration_open', 'sold_out', 'completed']

// 'auto' (or unset) = derive from the offering. Anything unrecognized is
// ignored rather than trusted, so a typo can never blank the page.
export function getDemoPageStateOverride() {
  const raw = (process.env.DEMO_PAGE_STATE || '').trim().toLowerCase()
  if (!raw || raw === 'auto') return null
  return DEMO_PAGE_STATES.includes(raw) ? raw : null
}

// status -> the story the page tells:
//   'open'   the next demo is on sale
//   'full'   it sold out (or staff paused public booking)
//   'closed' the event happened / the window passed — evergreen recap
//   anything else: no live demo at all, evergreen waitlist page
function derivePageState(status) {
  if (status === 'open') return 'registration_open'
  if (status === 'full') return 'sold_out'
  if (status === 'closed') return 'completed'
  return 'waitlist'
}

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
//   { status: 'closed', programId, offeringId, program, offering, waitlistOpen }
//   { status: 'unavailable' } | { status: 'unconfigured' }
// 'full' also covers staff pausing public booking (publicRegistrationPaused)
// while seats remain internally; waitlistOpen mirrors the offering's own
// waitlistEnabled switch, exactly what submit-demo-waitlist.js enforces —
// including on 'closed', where the waitlist is for the NEXT demo rather
// than for a seat at this one.
//
// Every result also carries `pageState`, the lifecycle state /demo renders
// (see DEMO_PAGE_STATES). It never unlocks anything: booking is gated on
// status === 'open' and the waitlist on waitlistOpen, both server-enforced
// again at submission time.
//
// `db` is injectable purely for tests/demo-campaign.test.mjs — ESM module
// namespaces are frozen, so getAdminDb can't be monkey-patched from outside
// like a CommonJS export. Resolved lazily (not as a default-parameter
// expression) so the 'unconfigured' short-circuit below never needs real
// Firebase Admin credentials to be present.
/**
 * @typedef {Object} DemoCampaign
 * @property {'open' | 'full' | 'closed' | 'unavailable' | 'unconfigured'} status
 * @property {'waitlist' | 'registration_open' | 'sold_out' | 'completed'} pageState
 * @property {string} [programId]
 * @property {string} [offeringId]
 * @property {any} [program]
 * @property {any} [offering]
 * @property {boolean} [waitlistOpen] Meaningful when status is 'full' or 'closed'.
 *
 * @param {any} [db]
 * @returns {Promise<DemoCampaign>}
 */
export async function resolveDemoCampaignOffering(db) {
  const config = getDemoCampaignConfig()
  if (!config) return withPageState({ status: 'unconfigured' })
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
    return withPageState({ status: 'unavailable' })
  }

  const base = { programId: config.programId, offeringId: config.offeringId, program: live.program, offering: live.offering }
  const waitlistOpen = live.offering.waitlistEnabled === true
  const state = demoPublicBookingState(live.offering)
  if (state === 'open') return withPageState({ status: 'open', ...base })
  if (state === 'full') return withPageState({ status: 'full', ...base, waitlistOpen })
  if (state === 'closed') return withPageState({ status: 'closed', ...base, waitlistOpen })
  return withPageState({ status: 'unavailable' })
}

// Applies the DEMO_PAGE_STATE override on top of the derived state. The
// override can never claim registration is open when the offering itself
// isn't bookable — that would show a $10 CTA the endpoint would reject.
function withPageState(campaign) {
  const derived = derivePageState(campaign.status)
  const override = getDemoPageStateOverride()
  const pageState = override && !(override === 'registration_open' && campaign.status !== 'open')
    ? override
    : derived
  return { ...campaign, pageState }
}
