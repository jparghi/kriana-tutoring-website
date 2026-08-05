import test from 'node:test'
import assert from 'node:assert/strict'
import { generateClassSchedule, getOntarioHolidays } from '../lib/class-schedule.js'

function labels(result) {
  return result.classDates.map(d => d.label)
}

test('ten Monday classes beginning September 14, 2026 — Thanksgiving excluded, exact spec example', () => {
  const result = generateClassSchedule({
    firstClassDate: '2026-09-14',
    weekday: 'Monday',
    classCount: 10,
  })

  assert.deepEqual(labels(result), [
    'Monday, September 14, 2026',
    'Monday, September 21, 2026',
    'Monday, September 28, 2026',
    'Monday, October 5, 2026',
    'Monday, October 19, 2026',
    'Monday, October 26, 2026',
    'Monday, November 2, 2026',
    'Monday, November 9, 2026',
    'Monday, November 16, 2026',
    'Monday, November 23, 2026',
  ])
  assert.equal(result.classDates.length, 10)
  assert.deepEqual(result.excludedDates, [
    { date: '2026-10-12', name: 'Thanksgiving', label: 'Monday, October 12, 2026' },
  ])
  assert.equal(result.startDate, '2026-09-14')
  assert.equal(result.endDate, '2026-11-23')
})

test('a schedule crossing Christmas and Boxing Day skips whichever one lands on the class weekday', () => {
  // Dec 25, 2022 is a Sunday, so Christmas is observed Monday Dec 26 (the
  // date that would nominally be Boxing Day) and Boxing Day itself shifts
  // again to Tuesday Dec 27 — a Monday-weekday program only ever collides
  // with Christmas's observed date here, which is exactly what a real
  // family would see: one skipped Monday, not two.
  const result = generateClassSchedule({
    firstClassDate: '2022-12-05',
    weekday: 'Monday',
    classCount: 5,
  })

  assert.deepEqual(labels(result), [
    'Monday, December 5, 2022',
    'Monday, December 12, 2022',
    'Monday, December 19, 2022',
    'Monday, January 9, 2023',
    'Monday, January 16, 2023',
  ])
  assert.deepEqual(result.excludedDates, [
    { date: '2022-12-26', name: 'Christmas Day', label: 'Monday, December 26, 2022' },
    { date: '2023-01-02', name: "New Year's Day", label: 'Monday, January 2, 2023' },
  ])
  assert.equal(result.classDates.length, 5)
})

test('a schedule crossing New Year\'s Day excludes it without shorting the class count', () => {
  const result = generateClassSchedule({
    firstClassDate: '2025-12-04',
    weekday: 'Thursday',
    classCount: 6,
  })

  assert.deepEqual(labels(result), [
    'Thursday, December 4, 2025',
    'Thursday, December 11, 2025',
    'Thursday, December 18, 2025',
    'Thursday, January 8, 2026',
    'Thursday, January 15, 2026',
    'Thursday, January 22, 2026',
  ])
  assert.deepEqual(result.excludedDates, [
    { date: '2025-12-25', name: 'Christmas Day', label: 'Thursday, December 25, 2025' },
    { date: '2026-01-01', name: "New Year's Day", label: 'Thursday, January 1, 2026' },
  ])
})

test('Family Day is excluded (3rd Monday of February)', () => {
  const result = generateClassSchedule({ firstClassDate: '2026-02-02', weekday: 'Monday', classCount: 4 })
  assert.deepEqual(result.excludedDates, [
    { date: '2026-02-16', name: 'Family Day', label: 'Monday, February 16, 2026' },
  ])
  assert.deepEqual(labels(result), [
    'Monday, February 2, 2026',
    'Monday, February 9, 2026',
    'Monday, February 23, 2026',
    'Monday, March 2, 2026',
  ])
})

test('Good Friday is excluded (Friday before Easter Sunday)', () => {
  const result = generateClassSchedule({ firstClassDate: '2026-03-20', weekday: 'Friday', classCount: 4 })
  assert.deepEqual(result.excludedDates, [
    { date: '2026-04-03', name: 'Good Friday', label: 'Friday, April 3, 2026' },
  ])
  assert.deepEqual(labels(result), [
    'Friday, March 20, 2026',
    'Friday, March 27, 2026',
    'Friday, April 10, 2026',
    'Friday, April 17, 2026',
  ])
})

test('Victoria Day is excluded (Monday on or before May 24)', () => {
  const result = generateClassSchedule({ firstClassDate: '2026-05-04', weekday: 'Monday', classCount: 4 })
  assert.deepEqual(result.excludedDates, [
    { date: '2026-05-18', name: 'Victoria Day', label: 'Monday, May 18, 2026' },
  ])
})

test('Canada Day observed date is excluded when July 1 falls on a weekend', () => {
  // July 1, 2028 is a Saturday, so Canada Day is observed Monday July 3.
  const result = generateClassSchedule({ firstClassDate: '2028-06-19', weekday: 'Monday', classCount: 4 })
  assert.deepEqual(result.excludedDates, [
    { date: '2028-07-03', name: 'Canada Day', label: 'Monday, July 3, 2028' },
  ])
})

test('Labour Day is excluded (1st Monday of September)', () => {
  const result = generateClassSchedule({ firstClassDate: '2026-08-24', weekday: 'Monday', classCount: 4 })
  assert.deepEqual(result.excludedDates, [
    { date: '2026-09-07', name: 'Labour Day', label: 'Monday, September 7, 2026' },
  ])
})

test('Thanksgiving is excluded (2nd Monday of October)', () => {
  const result = generateClassSchedule({ firstClassDate: '2026-10-05', weekday: 'Monday', classCount: 3 })
  assert.deepEqual(result.excludedDates, [
    { date: '2026-10-12', name: 'Thanksgiving', label: 'Monday, October 12, 2026' },
  ])
})

test('observed (weekend-shifted) holiday dates are used, not the raw fixed date', () => {
  // 2028: New Year's Day (Jan 1) falls on a Saturday, so it is observed the
  // following Monday, Jan 3 — a Monday-weekday program must skip Jan 3, not
  // treat Jan 1 (which was never a candidate class date anyway) specially.
  const holidays2028 = getOntarioHolidays(2028)
  const newYears = holidays2028.find(h => h.name === "New Year's Day")
  assert.equal(newYears.date, '2028-01-03')

  const result = generateClassSchedule({ firstClassDate: '2027-12-20', weekday: 'Monday', classCount: 3 })
  assert.deepEqual(result.excludedDates, [
    { date: '2027-12-27', name: 'Christmas Day', label: 'Monday, December 27, 2027' },
    { date: '2028-01-03', name: "New Year's Day", label: 'Monday, January 3, 2028' },
  ])
})

test('a custom closure date is excluded alongside statutory holidays, with its own name', () => {
  const result = generateClassSchedule({
    firstClassDate: '2026-09-14',
    weekday: 'Monday',
    classCount: 4,
    excludedDates: [{ date: '2026-09-28', name: 'Facility Closure — Flooring Repairs' }],
  })

  assert.deepEqual(result.excludedDates, [
    { date: '2026-09-28', name: 'Facility Closure — Flooring Repairs', label: 'Monday, September 28, 2026' },
    { date: '2026-10-12', name: 'Thanksgiving', label: 'Monday, October 12, 2026' },
  ])
  assert.deepEqual(labels(result), [
    'Monday, September 14, 2026',
    'Monday, September 21, 2026',
    'Monday, October 5, 2026',
    'Monday, October 19, 2026',
  ])
})

test('a custom date range (e.g. winter break) excludes every matching weekday within it', () => {
  const result = generateClassSchedule({
    firstClassDate: '2026-12-07',
    weekday: 'Monday',
    classCount: 3,
    excludedDates: [{ startDate: '2026-12-21', endDate: '2027-01-04', name: 'Winter Break' }],
  })

  // Dec 7 and Dec 14 are normal classes; Dec 21 and Dec 28 fall inside the
  // winter-break range (Dec 28 is also Boxing-Day-observed, but the custom
  // range should cover it regardless); Jan 4 is the last day of the range;
  // Jan 11 is the first class back.
  assert.deepEqual(labels(result), [
    'Monday, December 7, 2026',
    'Monday, December 14, 2026',
    'Monday, January 11, 2027',
  ])
  const excludedDateStrings = result.excludedDates.map(e => e.date)
  assert.ok(excludedDateStrings.includes('2026-12-21'))
  assert.ok(excludedDateStrings.includes('2026-12-28'))
  assert.ok(excludedDateStrings.includes('2027-01-04'))
})

test('leap-year behaviour: a schedule crossing February 29 counts correctly and does not skip a real day', () => {
  const result = generateClassSchedule({ firstClassDate: '2028-02-15', weekday: 'Tuesday', classCount: 4 })
  assert.deepEqual(labels(result), [
    'Tuesday, February 15, 2028',
    'Tuesday, February 22, 2028',
    'Tuesday, February 29, 2028',
    'Tuesday, March 7, 2028',
  ])
  assert.deepEqual(result.excludedDates, [])
  assert.equal(result.endDate, '2028-03-07')
})

test('leap-year holidays compute correctly (Family Day, Good Friday) in a leap year', () => {
  const holidays = getOntarioHolidays(2028)
  assert.deepEqual(
    holidays.find(h => h.name === 'Family Day'),
    { date: '2028-02-21', name: 'Family Day', label: 'Monday, February 21, 2028' },
  )
  assert.deepEqual(
    holidays.find(h => h.name === 'Good Friday'),
    { date: '2028-04-14', name: 'Good Friday', label: 'Friday, April 14, 2028' },
  )
})

test('invalid or missing inputs degrade gracefully instead of producing incorrect dates', () => {
  const empty = { classDates: [], excludedDates: [], startDate: null, endDate: null }

  assert.deepEqual(generateClassSchedule({}), empty)
  assert.deepEqual(generateClassSchedule(), empty)
  assert.deepEqual(generateClassSchedule({ firstClassDate: '2026-09-14', weekday: 'Monday', classCount: 0 }), empty)
  assert.deepEqual(generateClassSchedule({ firstClassDate: '2026-09-14', weekday: 'Monday', classCount: -3 }), empty)
  assert.deepEqual(generateClassSchedule({ firstClassDate: '2026-09-14', weekday: 'Monday', classCount: 1.5 }), empty)
  assert.deepEqual(generateClassSchedule({ firstClassDate: '2026-09-14', weekday: 'Someday', classCount: 5 }), empty)
  assert.deepEqual(generateClassSchedule({ firstClassDate: '2026-09-14', classCount: 5 }), empty)
  assert.deepEqual(generateClassSchedule({ weekday: 'Monday', classCount: 5 }), empty)
  assert.deepEqual(generateClassSchedule({ firstClassDate: 'not-a-date', weekday: 'Monday', classCount: 5 }), empty)
  assert.deepEqual(generateClassSchedule({ firstClassDate: '2026-13-40', weekday: 'Monday', classCount: 5 }), empty)
  assert.deepEqual(generateClassSchedule({ firstClassDate: null, weekday: 'Monday', classCount: 5 }), empty)
})

test('the starting date snaps forward to the first real occurrence of the given weekday', () => {
  // Sep 14, 2026 is itself a Monday, so this should behave identically to
  // passing the exact date — but if a program's stored firstClassDate were
  // ever off by a day or two, this keeps the schedule self-correcting rather
  // than silently generating classes on the wrong day of the week.
  const result = generateClassSchedule({ firstClassDate: '2026-09-12', weekday: 'Monday', classCount: 2 })
  assert.deepEqual(labels(result), [
    'Monday, September 14, 2026',
    'Monday, September 21, 2026',
  ])
})

test('accepts a Firestore-Timestamp-like value (toDate()) and an ISO datetime string, resolved in the given time zone', () => {
  // A stored offering.firstClassDate is typically an instant like
  // "2026-09-14T21:00:00.000Z" (5pm Toronto/EDT) — must resolve to the
  // Toronto calendar date (Sep 14), not the UTC calendar date (also Sep 14
  // here, so also check a case where UTC and Toronto actually disagree).
  const isoResult = generateClassSchedule({
    firstClassDate: '2026-09-14T21:00:00.000Z',
    weekday: 'Monday',
    classCount: 1,
  })
  assert.equal(isoResult.startDate, '2026-09-14')

  // 11pm Toronto (EDT, UTC-4) on Sep 14 is 3am UTC on Sep 15 — a naive UTC
  // read would misidentify this as Tuesday Sep 15.
  const lateNight = generateClassSchedule({
    firstClassDate: '2026-09-15T02:30:00.000Z',
    weekday: 'Monday',
    classCount: 1,
  })
  assert.equal(lateNight.startDate, '2026-09-14')

  const timestampLike = generateClassSchedule({
    firstClassDate: { toDate: () => new Date('2026-09-14T21:00:00.000Z') },
    weekday: 'Monday',
    classCount: 1,
  })
  assert.equal(timestampLike.startDate, '2026-09-14')
})

test('a supplied Date object is never mutated', () => {
  const original = new Date('2026-09-14T21:00:00.000Z')
  const originalTime = original.getTime()
  generateClassSchedule({ firstClassDate: original, weekday: 'Monday', classCount: 10 })
  assert.equal(original.getTime(), originalTime)
})

test('respects a non-default time zone', () => {
  // Same instant, read in a time zone far enough ahead of Toronto that the
  // calendar date genuinely differs.
  const result = generateClassSchedule({
    firstClassDate: '2026-09-14T21:00:00.000Z', // 9pm UTC = 5pm Toronto (Sep 14) = 6am next day in Tokyo (Sep 15)
    weekday: 'Tuesday',
    classCount: 1,
    timeZone: 'Asia/Tokyo',
  })
  assert.equal(result.startDate, '2026-09-15')
})
