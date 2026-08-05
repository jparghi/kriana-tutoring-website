// Reusable weekly class-schedule generator. Given a first class date, a
// weekday, and a purchased class count, produces the exact list of real
// class dates — skipping Ontario public holidays (and any caller-supplied
// closures) without counting them toward the purchased class count.
//
// This is intentionally program-agnostic: nothing here is specific to
// Smartivo or any other program. All date math is done as pure integer
// (year, month, day) arithmetic via a Julian Day Number (JDN) conversion,
// which avoids the two usual sources of date bugs in JS:
//   - `Date` UTC/local shifting (a bare "2026-09-14" parses as UTC midnight,
//     which can render as Sep 13 in a negative-UTC-offset timezone).
//   - DST arithmetic surprises when adding "7 days" to a `Date` that carries
//     a time-of-day component near a DST transition.
// The only place an actual `Date`/`Intl` is used is to resolve "which
// calendar day, in the given time zone, does this stored instant fall on" —
// exactly once, for the input `firstClassDate` — after which everything is
// plain integer math.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ─── Pure calendar-date arithmetic (Julian Day Number) ─────────────────────
// Fliegel & Van Flandern's civil-calendar <-> JDN conversion. Correct for the
// proleptic Gregorian calendar, including leap years, for any date this
// application will ever need (there's no special-casing of centuries etc.
// required in the range we operate in).

function toJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

function fromJDN(jdn) {
  const a = jdn + 32044
  const b = Math.floor((4 * a + 3) / 146097)
  const c = a - Math.floor((146097 * b) / 4)
  const d = Math.floor((4 * c + 3) / 1461)
  const e = c - Math.floor((1461 * d) / 4)
  const m = Math.floor((5 * e + 2) / 153)
  const day = e - Math.floor((153 * m + 2) / 5) + 1
  const month = m + 3 - 12 * Math.floor(m / 10)
  const year = 100 * b + d - 4800 + Math.floor(m / 10)
  return { year, month, day }
}

/** 0 = Sunday … 6 = Saturday, matching JS Date#getDay() and this codebase's WEEKDAYS convention. */
function dayOfWeek(jdn) {
  return (jdn + 1) % 7
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function dateKey(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function formatLabel(year, month, day) {
  const dow = dayOfWeek(toJDN(year, month, day))
  return `${WEEKDAYS[dow]}, ${MONTH_NAMES[month - 1]} ${day}, ${year}`
}

// ─── Parsing calendar dates without locale/timezone ambiguity ──────────────

const BARE_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function isValidCalendarDate({ year, month, day }) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  // Round-trip through JDN to reject e.g. Feb 30 — fromJDN(toJDN(y,m,d)) only
  // equals the input for a real calendar date.
  const roundTrip = fromJDN(toJDN(year, month, day))
  return roundTrip.year === year && roundTrip.month === month && roundTrip.day === day
}

/** Parses a bare "YYYY-MM-DD" string into {year, month, day} with no Date/locale involved. Returns null if malformed or not a real date. */
function parseBareDate(value) {
  if (typeof value !== 'string') return null
  const match = BARE_DATE_RE.exec(value)
  if (!match) return null
  const parsed = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  return isValidCalendarDate(parsed) ? parsed : null
}

/**
 * Resolves any of the shapes the rest of the codebase uses for a stored
 * class-start value (Firestore Timestamp, ISO datetime string, bare
 * "YYYY-MM-DD" string, `Date`) into a plain {year, month, day} calendar date,
 * as seen in `timeZone`. Never mutates a `Date` it's handed.
 */
function resolveCalendarDate(value, timeZone) {
  if (value == null) return null

  if (typeof value === 'string') {
    const bare = parseBareDate(value)
    if (bare) return bare
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    return calendarDateInTimeZone(parsed, timeZone)
  }

  if (typeof value?.toDate === 'function') {
    const asDate = value.toDate()
    return Number.isNaN(asDate?.getTime?.()) ? null : calendarDateInTimeZone(asDate, timeZone)
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : calendarDateInTimeZone(value, timeZone)
  }

  return null
}

function calendarDateInTimeZone(date, timeZone) {
  // Intl.DateTimeFormat with an explicit IANA time zone is the correct,
  // DST-safe way to answer "what calendar date is this instant, there" —
  // it never touches the process's local time zone or the string's own
  // offset, sidestepping the UTC-shift bug this utility must avoid.
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const map = {}
  for (const part of parts) map[part.type] = part.value
  const year = Number(map.year)
  const month = Number(map.month)
  const day = Number(map.day)
  return isValidCalendarDate({ year, month, day }) ? { year, month, day } : null
}

// ─── Ontario public holidays ────────────────────────────────────────────────

/** The Nth occurrence (1-based) of `weekdayIndex` (0=Sun..6=Sat) in a given month. */
function nthWeekdayOfMonth(year, month, weekdayIndex, n) {
  const firstOfMonthJdn = toJDN(year, month, 1)
  const firstDow = dayOfWeek(firstOfMonthJdn)
  let offset = weekdayIndex - firstDow
  if (offset < 0) offset += 7
  return fromJDN(firstOfMonthJdn + offset + (n - 1) * 7)
}

/** The most recent Monday on or before May 24 (Victoria Day's definition). */
function victoriaDay(year) {
  const may24Jdn = toJDN(year, 5, 24)
  const dow = dayOfWeek(may24Jdn)
  const daysSinceMonday = (dow - 1 + 7) % 7
  return fromJDN(may24Jdn - daysSinceMonday)
}

/** Easter Sunday via the Meeus/Jones/Butcher Gregorian algorithm. */
function easterSunday(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { year, month, day }
}

/** A fixed-date holiday, shifted to the following Monday if it falls on a weekend. */
function fixedDateWithMondayShift(year, month, day, name) {
  const jdn = toJDN(year, month, day)
  const dow = dayOfWeek(jdn)
  let observedJdn = jdn
  if (dow === 6) observedJdn = jdn + 2 // Saturday -> Monday
  else if (dow === 0) observedJdn = jdn + 1 // Sunday -> Monday
  return { ...fromJDN(observedJdn), name }
}

const holidayCache = new Map()

/**
 * Every Ontario public (statutory) holiday observed in `year`, with
 * weekend-observance shifts applied — including Christmas/Boxing Day's
 * combined shift (the two are adjacent, so a weekend Christmas pushes Boxing
 * Day's observance an extra day to avoid a collision).
 */
function ontarioHolidaysForYear(year) {
  if (holidayCache.has(year)) return holidayCache.get(year)

  const holidays = []
  holidays.push(fixedDateWithMondayShift(year, 1, 1, "New Year's Day"))
  holidays.push({ ...nthWeekdayOfMonth(year, 2, 1, 3), name: 'Family Day' })

  const easter = easterSunday(year)
  holidays.push({ ...fromJDN(toJDN(easter.year, easter.month, easter.day) - 2), name: 'Good Friday' })

  holidays.push({ ...victoriaDay(year), name: 'Victoria Day' })
  holidays.push(fixedDateWithMondayShift(year, 7, 1, 'Canada Day'))
  holidays.push({ ...nthWeekdayOfMonth(year, 9, 1, 1), name: 'Labour Day' })
  holidays.push({ ...nthWeekdayOfMonth(year, 10, 1, 2), name: 'Thanksgiving' })

  const xmasJdn = toJDN(year, 12, 25)
  const xmasDow = dayOfWeek(xmasJdn)
  let xmasObservedJdn = xmasJdn
  let boxingObservedJdn = xmasJdn + 1
  if (xmasDow === 6) { // Christmas on Saturday -> Monday; Boxing Day (Sunday) -> Tuesday
    xmasObservedJdn = xmasJdn + 2
    boxingObservedJdn = xmasJdn + 3
  } else if (xmasDow === 0) { // Christmas on Sunday -> Monday; Boxing Day (nominally that same Monday) -> Tuesday
    xmasObservedJdn = xmasJdn + 1
    boxingObservedJdn = xmasJdn + 2
  } else if (xmasDow === 5) { // Christmas on Friday (no shift); Boxing Day (Saturday) -> Monday
    boxingObservedJdn = xmasJdn + 3
  }
  holidays.push({ ...fromJDN(xmasObservedJdn), name: 'Christmas Day' })
  holidays.push({ ...fromJDN(boxingObservedJdn), name: 'Boxing Day' })

  holidayCache.set(year, holidays)
  return holidays
}

// ─── Custom (non-statutory) excluded dates ──────────────────────────────────

/**
 * Normalizes the caller-supplied `excludedDates` option — either individual
 * `{ date, name }` entries or `{ startDate, endDate, name }` ranges (for
 * things like winter break or March break) — into a dateKey -> name map.
 * Entries that don't parse are skipped rather than throwing.
 */
function normalizeCustomExcludedDates(entries) {
  const map = new Map()
  if (!Array.isArray(entries)) return map

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue
    const name = typeof entry.name === 'string' && entry.name.trim() ? entry.name : 'Closed'

    if (entry.date) {
      const parsed = parseBareDate(entry.date)
      if (parsed) map.set(dateKey(parsed.year, parsed.month, parsed.day), name)
      continue
    }

    if (entry.startDate && entry.endDate) {
      const start = parseBareDate(entry.startDate)
      const end = parseBareDate(entry.endDate)
      if (!start || !end) continue
      let jdn = toJDN(start.year, start.month, start.day)
      const endJdn = toJDN(end.year, end.month, end.day)
      // Safety cap: a malformed multi-year range shouldn't hang the loop.
      let guard = 0
      while (jdn <= endJdn && guard < 3660) {
        const d = fromJDN(jdn)
        map.set(dateKey(d.year, d.month, d.day), name)
        jdn++
        guard++
      }
    }
  }

  return map
}

// ─── Public API ──────────────────────────────────────────────────────────────

const EMPTY_RESULT = Object.freeze({
  classDates: [],
  excludedDates: [],
  startDate: null,
  endDate: null,
})

/**
 * Generates the exact weekly class-date schedule for a purchased class
 * count, skipping Ontario statutory holidays and any caller-supplied
 * closures — those weeks don't count toward the purchased total, so the
 * schedule always contains exactly `classCount` real class dates (or fewer,
 * only if a safety cap is hit — see below).
 *
 * @param {object} input
 * @param {string|Date|{toDate:()=>Date}} input.firstClassDate - the first class's date.
 * @param {string} input.weekday - e.g. "Monday" (matches this codebase's WEEKDAYS spelling).
 * @param {number} input.classCount - number of classes purchased (must be a positive integer).
 * @param {string} [input.timeZone] - IANA time zone for resolving `firstClassDate`; defaults to America/Toronto.
 * @param {Array<{date:string,name:string}|{startDate:string,endDate:string,name:string}>} [input.excludedDates] - additional non-statutory closures (winter break, March break, facility closures, one-off cancellations).
 * @returns {{classDates: Array<{date:string,label:string}>, excludedDates: Array<{date:string,name:string,label:string}>, startDate: string|null, endDate: string|null}}
 */
export function generateClassSchedule(input) {
  const {
    firstClassDate,
    weekday,
    classCount,
    timeZone = 'America/Toronto',
    excludedDates: customExcludedInput,
  } = input || {}

  const weekdayIndex = WEEKDAYS.indexOf(String(weekday ?? ''))
  if (weekdayIndex === -1) return EMPTY_RESULT
  if (!Number.isInteger(classCount) || classCount <= 0) return EMPTY_RESULT

  const start = resolveCalendarDate(firstClassDate, timeZone)
  if (!start) return EMPTY_RESULT

  let cursorJdn = toJDN(start.year, start.month, start.day)
  const startDow = dayOfWeek(cursorJdn)
  if (startDow !== weekdayIndex) {
    let delta = weekdayIndex - startDow
    if (delta < 0) delta += 7
    cursorJdn += delta
  }

  const customExcluded = normalizeCustomExcludedDates(customExcludedInput)

  const classDates = []
  const excludedDates = []
  // Generous but finite safety cap so a pathological input (e.g. every week
  // excluded) can't hang the loop — about 15 purchased-class-equivalents of
  // headroom per class, plus a flat year of slack.
  const maxIterations = classCount * 15 + 52
  let iterations = 0

  while (classDates.length < classCount && iterations < maxIterations) {
    iterations++
    const { year, month, day } = fromJDN(cursorJdn)
    const key = dateKey(year, month, day)

    const holiday = ontarioHolidaysForYear(year).find(h => h.year === year && h.month === month && h.day === day)
    const customName = customExcluded.get(key)

    if (holiday) {
      excludedDates.push({ date: key, name: holiday.name, label: formatLabel(year, month, day) })
    } else if (customName) {
      excludedDates.push({ date: key, name: customName, label: formatLabel(year, month, day) })
    } else {
      classDates.push({ date: key, label: formatLabel(year, month, day) })
    }

    cursorJdn += 7
  }

  return {
    classDates,
    excludedDates,
    startDate: classDates.length > 0 ? classDates[0].date : null,
    endDate: classDates.length > 0 ? classDates[classDates.length - 1].date : null,
  }
}

/** Exposed for tests and any caller that needs the raw per-year holiday list (e.g. a program-config admin screen). */
export function getOntarioHolidays(year) {
  if (!Number.isInteger(year)) return []
  return ontarioHolidaysForYear(year).map(h => ({ date: dateKey(h.year, h.month, h.day), name: h.name, label: formatLabel(h.year, h.month, h.day) }))
}
