import { getDemoPricing } from './robotics-packages.js'

// Pure logic for the /events Demo Hub: which demo is "current", what state it is
// really in, and which demos are history. No firebase/next imports so both the
// server-rendered page and node:test can use it.
//
// Config (data/demos.ts) says what we *intend*; the live state of each
// session's Firestore offering (lib/demo-campaign.server.js) says what is
// *bookable*. Every session is its own offering with its own capacity and
// waitlist. Live state can only ever make the page more conservative: a
// session is 'open' only while its offering is open — the same rule the
// submit endpoints enforce — and a session with no readable offering is
// never bookable.

/**
 * @typedef {import('../data/demos').DemoEvent} DemoEvent
 * @typedef {import('../data/demos').DemoSession} DemoSession
 * @typedef {import('../data/demos').DemoStatus} DemoStatus
 * @typedef {'open' | 'full' | 'closed' | 'unavailable'} SessionState
 * @typedef {DemoSession & { state: SessionState, waitlistOpen: boolean }} LiveSession
 * @typedef {Record<string, { status: string, waitlistOpen?: boolean }>} LiveSessions
 */

function lastSessionEnd(demo) {
  const ends = (demo.sessions ?? []).map(session => Date.parse(session.endIso)).filter(Number.isFinite)
  // No sessions: treat the whole local day as still open.
  return ends.length ? Math.max(...ends) : Date.parse(`${demo.date}T23:59:59-04:00`)
}

/**
 * @param {DemoEvent[]} demos
 * @param {LiveSessions | null} live  keyed by session offeringId
 * @param {number} [now]
 * @returns {{
 *   active: DemoEvent | null,
 *   status: DemoStatus,
 *   sessions: LiveSession[],
 *   canRegister: boolean,
 *   past: DemoEvent[],
 * }}
 * `past` is newest first. `status` is WAITLIST when there is no upcoming demo.
 * `canRegister` means at least one session can be booked right now.
 */
export function resolveDemoHub(demos, live, now = Date.now()) {
  const stateOf = session => /** @type {SessionState} */ (
    (session.offeringId && live?.[session.offeringId]?.status) || 'unavailable'
  )
  const isOver = demo => demo.status === 'COMPLETED' || lastSessionEnd(demo) < now
  // Every session's booking window has closed: the event is under way or done.
  const allClosed = demo => demo.sessions.length > 0 && demo.sessions.every(session => stateOf(session) === 'closed')
  const byDate = [...demos].sort((a, b) => a.date.localeCompare(b.date))

  const upcoming = byDate.filter(demo => !isOver(demo) && !allClosed(demo))
  const past = byDate.filter(demo => isOver(demo) || allClosed(demo)).sort((a, b) => b.date.localeCompare(a.date))
  const active = upcoming[0] ?? null
  if (!active) return { active: null, status: 'WAITLIST', sessions: [], canRegister: false, past }

  // SOLD_OUT / WAITLIST pinned in the data file means "stop public booking".
  const pinned = active.status === 'SOLD_OUT' || active.status === 'WAITLIST'
  const sessions = active.sessions.map(session => {
    const state = stateOf(session)
    return {
      ...session,
      state: pinned && state === 'open' ? 'full' : state,
      waitlistOpen: Boolean(session.offeringId && live?.[session.offeringId]?.waitlistOpen),
    }
  })

  const canRegister = sessions.some(session => session.state === 'open')
  /** @type {DemoStatus} */
  let status
  if (canRegister) status = 'REGISTRATION_OPEN'
  else if (sessions.some(session => session.state === 'full')) status = 'SOLD_OUT'
  else status = active.status === 'COMPLETED' ? 'WAITLIST' : active.status // nothing live to say otherwise
  return { active, status, sessions, canRegister, past }
}

/** "Morning Workshop" -> "Morning"; falls back to the time label when unnamed. */
export function sessionShortName(session) {
  return (session.name || session.label).replace(/\s+(workshop|session|demo class|demo)$/i, '')
}

/**
 * Some sessions sold out while others are still bookable — the page then
 * leads with the sold-out news and steers to what's left. Derived only from
 * live session state, so it can never announce a sell-out the register
 * endpoint wouldn't also enforce.
 * @param {LiveSession[]} sessions
 * @returns {{ soldOut: LiveSession, open: LiveSession } | null}
 */
export function partialSellout(sessions) {
  const soldOut = sessions.find(session => session.state === 'full')
  const open = sessions.find(session => session.state === 'open')
  return soldOut && open ? { soldOut, open } : null
}

/** "September 12" / "Oct 2" style labels from a YYYY-MM-DD, timezone-safe. */
export function formatDemoDate(date, style = 'long') {
  const [year, month, day] = date.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day, 12))
  return utc.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    ...(style === 'full'
      ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
      : style === 'short'
        ? { month: 'short', day: 'numeric' }
        : { month: 'long', day: 'numeric' }),
  })
}

export function demoMonth(date) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long' })
}

/**
 * Display wording for a demo's price from its config (the charged amount
 * always comes from the offering — see getDemoPricing).
 *   price:   25 — the before-tax dollar amount that applies right now
 *   current: "$25 + tax" — what applies right now
 *   detail:  "Early bird $25 + tax until Oct 15 · Regular $30 + tax", or just
 *            `current` when there's no early bird running
 */
export function demoPriceText(demo, now = Date.now()) {
  const tax = demo.plusTax ? ' + tax' : ''
  const regular = `$${demo.price}${tax}`
  const endsMs = demo.earlyBird ? Date.parse(demo.earlyBird.endsIso) : NaN
  if (!demo.earlyBird || !(now < endsMs)) return { price: demo.price, current: regular, detail: regular }
  const early = `$${demo.earlyBird.price}${tax}`
  // endsIso is exclusive, so the last early-bird day is the day before it.
  const until = new Date(Date.parse(`${demo.earlyBird.endsIso.slice(0, 10)}T12:00:00Z`) - 86400000).toISOString().slice(0, 10)
  return { price: demo.earlyBird.price, current: early, detail: `Early bird ${early} until ${formatDemoDate(until, 'short')} · Regular ${regular}` }
}

// ─── Themed, multi-date workshops (data/demos.ts `themes`) ────────────────

/** YYYY-MM-DD of a session, from its startIso (which carries the local offset). */
export function sessionDate(session) {
  return session.startIso.slice(0, 10)
}

/** "November 20" for one date, "November 20 & 23" for several in one month. */
export function eventDateLabel(demo, style = 'long') {
  const dates = [...new Set((demo.sessions ?? []).map(sessionDate))].sort()
  if (dates.length <= 1) return formatDemoDate(dates[0] ?? demo.date, style)
  const sameMonth = dates.every(date => date.slice(0, 7) === dates[0].slice(0, 7))
  if (style !== 'full' && sameMonth) {
    return `${formatDemoDate(dates[0], style)} & ${dates.slice(1).map(date => Number(date.slice(8))).join(' & ')}`
  }
  return dates.map(date => formatDemoDate(date, style)).join(' & ')
}

export const SEATS_LEFT_THRESHOLD = 3

/**
 * Seats a parent could still book — capacity minus confirmed AND held
 * (unpaid 48-hour e-transfer holds count as taken, exactly as the register
 * endpoint counts them) — but only once it's at or below `threshold`, so the
 * page never advertises a count until it is genuinely low. null otherwise,
 * and null for inconsistent counters (same rules as availableSeats in
 * submit-demo-registration.js).
 */
export function publicSeatsLeft(offering, threshold = SEATS_LEFT_THRESHOLD) {
  if (!offering) return null
  const capacity = Number(offering.capacity ?? 0)
  const taken = Number(offering.confirmedCount ?? 0) + Number(offering.heldCount ?? 0)
  if (!Number.isSafeInteger(capacity) || !Number.isSafeInteger(taken) || capacity <= 0 || taken < 0 || taken > capacity) return null
  const left = capacity - taken
  return left > 0 && left <= threshold ? left : null
}

/** "Nov 10" — the last day an exclusive early-bird end instant still applies, Ottawa time. */
function earlyBirdLastDay(endsAtIso) {
  return new Date(Date.parse(endsAtIso) - 1).toLocaleDateString('en-US', { timeZone: 'America/Toronto', month: 'short', day: 'numeric' })
}

// Display price when the live offering can't be read — the session can't be
// booked then anyway, so this only keeps the card informative.
function configPricing(demo, session, now) {
  const endsIso = session.earlyBirdEndsIso ?? demo.earlyBird?.endsIso
  const earlyBird = Boolean(demo.earlyBird && endsIso && now < Date.parse(endsIso))
  const subtotalCents = Math.round((earlyBird ? demo.earlyBird.price : demo.price) * 100)
  const taxCents = demo.plusTax ? Math.round(subtotalCents * 0.13) : 0
  return {
    priceCents: subtotalCents + taxCents, subtotalCents, taxCents,
    regularSubtotalCents: Math.round(demo.price * 100),
    earlyBird, earlyBirdEndsAt: earlyBird ? new Date(Date.parse(endsIso)).toISOString() : null,
  }
}

/**
 * The themed workshop picker's data: sessions grouped by date, each with its
 * live state, price (from its own offering — the amount the register endpoint
 * will charge) and a low-seat count. Plain JSON, safe to hand to a client
 * component.
 * @param {DemoEvent} demo
 * @param {LiveSession[]} sessions  resolveDemoHub(...).sessions
 * @param {Record<string, any>} offerings  live offering docs by offeringId
 */
export function workshopDays(demo, sessions, offerings, now = Date.now()) {
  const days = new Map()
  for (const session of sessions) {
    const date = sessionDate(session)
    if (!days.has(date)) days.set(date, [])
    const offering = session.offeringId ? offerings?.[session.offeringId] : null
    const pricing = offering ? getDemoPricing(offering, now) : configPricing(demo, session, now)
    days.get(date).push({
      offeringId: session.offeringId ?? '',
      theme: session.theme ?? '',
      time: session.label.split(' · ').pop(),
      part: Number(session.startIso.slice(11, 13)) < 12 ? 'Morning' : 'Afternoon', // local hour
      state: session.state,
      waitlistOpen: session.waitlistOpen,
      seatsLeft: session.state === 'open' ? publicSeatsLeft(offering) : null,
      subtotalCents: pricing.subtotalCents,
      taxCents: pricing.taxCents,
      priceCents: pricing.priceCents,
      regularSubtotalCents: pricing.regularSubtotalCents,
      earlyBirdUntil: pricing.earlyBird && pricing.earlyBirdEndsAt ? earlyBirdLastDay(pricing.earlyBirdEndsAt) : null,
    })
  }
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, daySessions]) => ({
      date,
      weekday: new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long' }),
      label: formatDemoDate(date, 'short'),
      sessions: daySessions, // config order (morning first)
    }))
}
