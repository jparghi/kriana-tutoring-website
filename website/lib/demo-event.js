// Display fields for a single-occurrence demo offering (the /demo campaign),
// derived from the offering doc's eventTitle / eventStartAt / eventEndAt /
// timezone / location — so a future demo only needs a new offering, never a
// code change to the page copy. Plain .js (no firebase imports) so both the
// server-rendered /demo page and node:test can use it.

const DEFAULT_TIMEZONE = 'America/Toronto'

function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function timeParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(date)
  const get = type => parts.find(part => part.type === type)?.value ?? ''
  return { clock: `${get('hour')}:${get('minute')}`, period: get('dayPeriod').toUpperCase() }
}

// "10:30–11:30 AM", or "11:30 AM–12:30 PM" when the period changes.
function formatTimeRange(start, end, timeZone) {
  const from = timeParts(start, timeZone)
  if (!end) return `${from.clock} ${from.period}`
  const to = timeParts(end, timeZone)
  return from.period === to.period
    ? `${from.clock}–${to.clock} ${to.period}`
    : `${from.clock} ${from.period}–${to.clock} ${to.period}`
}

/**
 * @returns {{
 *   title: string, area: string, dateLabel: string, shortDateLabel: string,
 *   timeLabel: string, venueName: string, address: string, location: string,
 *   startIso: string | null, endIso: string | null,
 * }}
 * Empty strings / nulls for anything the offering doesn't carry.
 */
export function describeDemoEvent(offering) {
  const timeZone = offering?.timezone || DEFAULT_TIMEZONE
  const start = toDate(offering?.eventStartAt)
  const end = toDate(offering?.eventEndAt)
  const title = typeof offering?.eventTitle === 'string' ? offering.eventTitle.trim() : ''
  // "Young Engineers Demo Class — Kanata" -> "Kanata"
  const area = title.includes('—') ? title.split('—').pop().trim() : ''
  const location = typeof offering?.location === 'string' ? offering.location.trim() : ''
  // "Ottawa Public Library - Hazeldean, 50 Castlefrank Rd, …" -> venue + address
  const commaIndex = location.indexOf(',')
  const venueName = commaIndex === -1 ? location : location.slice(0, commaIndex).trim()
  const address = commaIndex === -1 ? '' : location.slice(commaIndex + 1).trim()

  return {
    title,
    area,
    dateLabel: start
      ? start.toLocaleDateString('en-US', { timeZone, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : '',
    shortDateLabel: start ? start.toLocaleDateString('en-US', { timeZone, month: 'long', day: 'numeric' }) : '',
    timeLabel: start ? formatTimeRange(start, end, timeZone) : '',
    venueName,
    address,
    location,
    startIso: start ? start.toISOString() : null,
    endIso: end ? end.toISOString() : null,
  }
}
