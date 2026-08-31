import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getClassesByCalendarMonth,
  getBillingMonths,
  getLearningPathMonthlyTuition,
  getRegularMonthlyEstimate,
} from '../lib/robotics-monthly-tuition.js'

// --- getClassesByCalendarMonth / getBillingMonths: literal-schedule unit tests ---

function classDate(date) {
  return { date, label: date }
}

test('getClassesByCalendarMonth groups classDates by month in chronological order', () => {
  const schedule = {
    classDates: [
      classDate('2026-09-14'), classDate('2026-09-21'), classDate('2026-09-28'),
      classDate('2026-10-05'), classDate('2026-10-19'), classDate('2026-10-26'),
      classDate('2026-11-02'), classDate('2026-11-09'), classDate('2026-11-16'), classDate('2026-11-23'),
    ],
  }
  const months = getClassesByCalendarMonth(schedule)
  assert.deepEqual(months.map(m => [m.monthKey, m.monthLabel, m.classDates.length]), [
    ['2026-09', 'September 2026', 3],
    ['2026-10', 'October 2026', 3],
    ['2026-11', 'November 2026', 4],
  ])
})

test('getClassesByCalendarMonth returns [] for an empty or missing schedule', () => {
  assert.deepEqual(getClassesByCalendarMonth({ classDates: [] }), [])
  assert.deepEqual(getClassesByCalendarMonth(null), [])
  assert.deepEqual(getClassesByCalendarMonth(undefined), [])
})

test('getBillingMonths spans first-to-last month inclusive with no classes missing', () => {
  const schedule = { classDates: [classDate('2026-09-14'), classDate('2026-10-05'), classDate('2026-11-02')] }
  assert.deepEqual(getBillingMonths(schedule), ['2026-09', '2026-10', '2026-11'])
})

test('getBillingMonths fills in a zero-class calendar month in the middle of the span (e.g. winter break)', () => {
  // Classes in November and January, none in December — December must still
  // be a billing month per the approved policy.
  const schedule = { classDates: [classDate('2026-11-02'), classDate('2026-11-09'), classDate('2027-01-04')] }
  assert.deepEqual(getBillingMonths(schedule), ['2026-11', '2026-12', '2027-01'])
})

test('getBillingMonths returns [] for an empty schedule', () => {
  assert.deepEqual(getBillingMonths({ classDates: [] }), [])
})

// --- getLearningPathMonthlyTuition: real offering + package fixtures ---

// Hand-traced fixture: Monday classes starting 2026-09-14 (the same start
// date verified in tests/class-schedule.test.mjs), extended to a 20-class
// Builder path. Holidays along the way: Thanksgiving (Oct 12, 2026) and
// Boxing Day observed (Dec 28, 2026, since Dec 26 falls on a Saturday) — the
// only two exclusions in this span. The 20th class lands Feb 8, 2027.
// classesByMonth: Sep 3, Oct 3, Nov 5, Dec 3, Jan 4, Feb 2 — deliberately
// covers 3-, 4- and 5-class months, a Dec/Jan crossing, and a holiday
// exclusion, all in one real schedule.
const BUILDER_OFFERING = { firstClassDate: '2026-09-14', weekday: 'Monday', timezone: 'America/Toronto' }
const BUILDER_PKG = { classCount: 20, perClassCents: 2800 } // $560 total, matches the approved Builder rate

test('Builder path: classesByMonth matches the hand-traced 3/3/5/3/4/2 distribution across a Thanksgiving + Boxing Day exclusion', () => {
  const result = getLearningPathMonthlyTuition(BUILDER_OFFERING, BUILDER_PKG)
  assert.deepEqual(result.classesByMonth.map(m => [m.monthKey, m.classDates.length]), [
    ['2026-09', 3],
    ['2026-10', 3],
    ['2026-11', 5],
    ['2026-12', 3],
    ['2027-01', 4],
    ['2027-02', 2],
  ])
  // Every committed path contains exactly 20 real class dates — excluded
  // (holiday) dates never count toward this.
  assert.equal(result.classesByMonth.reduce((sum, m) => sum + m.classDates.length, 0), 20)
  assert.equal(result.firstClassDate, '2026-09-14')
  assert.equal(result.lastClassDate, '2027-02-08')
})

test('Builder path: total equals 20 x $28 and is averaged evenly across all 6 billing months, with only the final cent adjusted', () => {
  const result = getLearningPathMonthlyTuition(BUILDER_OFFERING, BUILDER_PKG)
  assert.equal(result.totalTuitionCents, 56000) // 20 x 2800
  assert.equal(result.billingMonthCount, 6)
  assert.deepEqual(result.monthlyAmountsCents, [9333, 9333, 9333, 9333, 9333, 9335])
  assert.equal(result.monthlyAmountsCents.reduce((a, b) => a + b, 0), 56000)
  assert.equal(result.representativeMonthlyCents, 9333)
  // Every monthly amount is identical regardless of whether that month held
  // 2, 3, 4 or 5 classes — the September/October/December $93.33 payments
  // are the same as November's (5 classes) and January's (4 classes).
  assert.deepEqual(new Set(result.monthlyAmountsCents.slice(0, -1)), new Set([9333]))
})

// The plan's companion example — the same $560 Builder total spanning
// exactly 5 billing months averages to a clean $112/month with no remainder
// — is exercised directly against computeInstallmentAmountsCents (the
// primitive getLearningPathMonthlyTuition delegates to for the split) in
// tests/robotics-packages.test.mjs, alongside the 6-month/$93.33 case.

const ENGINEER_OFFERING = { firstClassDate: '2026-09-14', weekday: 'Wednesday', timezone: 'America/Toronto' }
const ENGINEER_PKG = { classCount: 36, perClassCents: 2600 } // $936 total, matches the approved Engineer rate

test('Engineer path: 36 real classes, total $936, monthly amounts sum exactly to the total', () => {
  const result = getLearningPathMonthlyTuition(ENGINEER_OFFERING, ENGINEER_PKG)
  assert.equal(result.classesByMonth.reduce((sum, m) => sum + m.classDates.length, 0), 36)
  assert.equal(result.totalTuitionCents, 93600) // 36 x 2600
  assert.ok(result.billingMonthCount >= 8, 'a 36-class weekly path spans at least 8 months')
  assert.equal(result.monthlyAmountsCents.length, result.billingMonthCount)
  assert.equal(result.monthlyAmountsCents.reduce((a, b) => a + b, 0), 93600)
  // No amount is ever negative or absurdly large — every non-final payment
  // is the same rounded-even share.
  const regular = Math.round(93600 / result.billingMonthCount)
  assert.ok(result.monthlyAmountsCents.slice(0, -1).every(a => a === regular))
})

test('a path with a full calendar month closed out entirely (e.g. facility shutdown) still counts that month as a $0-class billing month', () => {
  // Weekly Monday classes starting Nov 2, 2026: 5 Mondays land in November
  // (2, 9, 16, 23, 30); all of December is closed via excludedDates, so the
  // schedule's 6th class skips straight to Jan 4, 2027 — December ends up
  // with zero real classes but must still appear as a billing month.
  const offering = {
    firstClassDate: '2026-11-02',
    weekday: 'Monday',
    timezone: 'America/Toronto',
    excludedDates: [{ startDate: '2026-12-01', endDate: '2026-12-31', name: 'Winter Shutdown' }],
  }
  const pkg = { classCount: 6, perClassCents: 2800 } // $168 total
  const result = getLearningPathMonthlyTuition(offering, pkg)

  assert.deepEqual(result.classesByMonth.map(m => m.monthKey), ['2026-11', '2027-01'])
  assert.equal(result.billingMonthCount, 3) // Nov, Dec (zero classes), Jan
  assert.equal(result.totalTuitionCents, 16800) // 6 x 2800
  assert.equal(result.monthlyAmountsCents.length, 3)
  assert.equal(result.monthlyAmountsCents.reduce((a, b) => a + b, 0), 16800)
})

test('an offering with no computable schedule reports zero billing months rather than guessing', () => {
  const result = getLearningPathMonthlyTuition({}, BUILDER_PKG)
  assert.deepEqual(result, {
    billingMonthCount: 0,
    totalTuitionCents: 0,
    monthlyAmountsCents: [],
    representativeMonthlyCents: 0,
    firstClassDate: null,
    lastClassDate: null,
    classesByMonth: [],
  })
})

// --- getRegularMonthlyEstimate: one real calendar month at a time ---

const REGULAR_OFFERING = { firstClassDate: '2026-09-14', weekday: 'Monday', timezone: 'America/Toronto' }
const REGULAR_PKG = { planType: 'rolling_monthly', perClassCents: 3000 }

test('Regular estimate for October 2026 counts 3 real Mondays (Thanksgiving excluded)', () => {
  const result = getRegularMonthlyEstimate(REGULAR_OFFERING, REGULAR_PKG, '2026-10')
  assert.equal(result.monthKey, '2026-10')
  assert.equal(result.monthLabel, 'October 2026')
  assert.equal(result.classesInMonth, 3)
  assert.equal(result.estimatedAmountCents, 9000) // 3 x 3000
})

test('Regular estimate for November 2026 counts 5 real Mondays — a different amount from October, by design', () => {
  const result = getRegularMonthlyEstimate(REGULAR_OFFERING, REGULAR_PKG, '2026-11')
  assert.equal(result.classesInMonth, 5)
  assert.equal(result.estimatedAmountCents, 15000) // 5 x 3000
})

test('Regular estimate for a fully-closed month is $0, not a guessed average', () => {
  const closedOffering = {
    ...REGULAR_OFFERING,
    excludedDates: [{ startDate: '2026-12-01', endDate: '2026-12-31', name: 'Winter Shutdown' }],
  }
  const result = getRegularMonthlyEstimate(closedOffering, REGULAR_PKG, '2026-12')
  assert.equal(result.classesInMonth, 0)
  assert.equal(result.estimatedAmountCents, 0)
})

test('Regular estimate defaults to the offering\'s own first-class month when no month is specified', () => {
  const result = getRegularMonthlyEstimate(REGULAR_OFFERING, REGULAR_PKG)
  assert.equal(result.monthKey, '2026-09')
  assert.equal(result.classesInMonth, 3) // Sep 14, 21, 28
})

test('Regular estimate with no resolvable month reports zero rather than guessing', () => {
  const result = getRegularMonthlyEstimate({}, REGULAR_PKG)
  assert.deepEqual(result, { monthKey: null, monthLabel: null, classesInMonth: 0, estimatedAmountCents: 0 })
})
