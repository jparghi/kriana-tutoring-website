// Pure logic for the /demo Demo Hub: which demo is "current", what state it is
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
