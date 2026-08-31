// Pure calendar-derived monthly-tuition math for robotics class packages.
// No Firestore/network access — imported by both Next.js and Netlify
// Functions (see submit-enrollment-request.js), so it depends only on plain
// JS lib modules (class-schedule.js, robotics-packages.js), never on the
// TypeScript booking.ts helpers, to stay bundler-safe in both contexts.
//
// This module never invents a monthly amount — every function here requires
// a real offering (firstClassDate/weekday/timezone/excludedDates) and
// derives numbers from the same holiday/closure-aware schedule generator
// used everywhere else (generateClassSchedule), rather than a second
// calendar engine.
import { generateClassSchedule } from './class-schedule.js'
import { computeInstallmentAmountsCents, resolvePackagePricing } from './robotics-packages.js'

/** Same mapping as booking.ts's getPackageClassSchedule(offering, pkg), kept
 * as a local duplicate (not an import) so this module has no dependency on
 * the TypeScript booking.ts helpers when bundled into a Netlify Function. */
function scheduleForOfferingAndClassCount(offering, classCount) {
  return generateClassSchedule({
    firstClassDate: offering?.firstClassDate ?? null,
    weekday: offering?.weekday ?? '',
    classCount,
    timeZone: offering?.timezone || 'America/Toronto',
    excludedDates: offering?.excludedDates ?? offering?.closureDates ?? undefined,
  })
}

function monthKeyOf(dateStr) {
  return dateStr.slice(0, 7) // "YYYY-MM-DD" -> "YYYY-MM"
}

/** Human month label for a "YYYY-MM" key, e.g. "October 2026". Formatted in
 * UTC since classDates are already resolved calendar-day strings — no
 * further timezone conversion is needed or correct at this point. */
function monthLabelOf(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)))
}

function addMonths(monthKey, delta) {
  const [year, month] = monthKey.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Groups a schedule's classDates by calendar month.
 * `schedule` is the result of generateClassSchedule / getPackageClassSchedule.
 * -> [{ monthKey: 'YYYY-MM', monthLabel: 'October 2026', classDates: [...] }, ...]
 * ordered chronologically, one entry per month that actually contains a class
 * (a zero-class month is not represented here — see getBillingMonths, which
 * fills those in separately for billing purposes). */
export function getClassesByCalendarMonth(schedule) {
  const months = new Map()
  for (const classDate of schedule?.classDates ?? []) {
    const key = monthKeyOf(classDate.date)
    if (!months.has(key)) months.set(key, { monthKey: key, monthLabel: monthLabelOf(key), classDates: [] })
    months.get(key).classDates.push(classDate)
  }
  return [...months.values()]
}

/** Every calendar month from the first committed class through the last,
 * inclusive — including a month with zero classes in between (e.g. a
 * winter-break month), per the approved billing policy. Returns [] if the
 * schedule has no classes. */
export function getBillingMonths(schedule) {
  const classesByMonth = getClassesByCalendarMonth(schedule)
  if (classesByMonth.length === 0) return []
  const firstMonthKey = classesByMonth[0].monthKey
  const lastMonthKey = classesByMonth[classesByMonth.length - 1].monthKey
  const months = []
  for (let key = firstMonthKey; key <= lastMonthKey; key = addMonths(key, 1)) {
    months.push(key)
    if (key === lastMonthKey) break
  }
  return months
}

/** Averaged monthly tuition for a fixed_learning_path package (Builder/
 * Engineer) given a real offering. Never guesses: if the offering doesn't
 * carry enough data to generate a schedule, billingMonthCount is 0 and
 * monthlyAmountsCents is [] — callers must show "schedule to be confirmed"
 * rather than a monthly number in that case. */
export function getLearningPathMonthlyTuition(offering, pkg) {
  const schedule = scheduleForOfferingAndClassCount(offering, pkg?.classCount)
  const classesByMonth = getClassesByCalendarMonth(schedule)
  const billingMonths = getBillingMonths(schedule)
  const billingMonthCount = billingMonths.length

  if (billingMonthCount === 0) {
    return {
      billingMonthCount: 0,
      totalTuitionCents: 0,
      monthlyAmountsCents: [],
      representativeMonthlyCents: 0,
      firstClassDate: null,
      lastClassDate: null,
      classesByMonth: [],
    }
  }

  const totalTuitionCents = resolvePackagePricing(pkg, 'recurring_monthly').payableSubtotalCents
  const monthlyAmountsCents = computeInstallmentAmountsCents(totalTuitionCents, billingMonthCount)

  return {
    billingMonthCount,
    totalTuitionCents,
    monthlyAmountsCents,
    // The first (non-remainder) amount is the stable, headline number —
    // only the final payment absorbs the rounding remainder.
    representativeMonthlyCents: monthlyAmountsCents[0],
    firstClassDate: schedule.startDate,
    lastClassDate: schedule.endDate,
    classesByMonth,
  }
}

/** One calendar month's estimated Regular tuition for a real offering.
 * Regular has no committed schedule, so this only ever prices ONE month at
 * a time — a bounded lookahead (6 weeks, comfortably more than any single
 * month's weekly classes) starting from that month's first day, filtered
 * down to the classes that actually land in `referenceMonthKey`.
 * `referenceMonthKey` defaults to the calendar month containing the
 * offering's own firstClassDate. */
export function getRegularMonthlyEstimate(offering, regularPkg, referenceMonthKey) {
  const monthKey = referenceMonthKey ?? (offering?.firstClassDate ? String(offering.firstClassDate).slice(0, 7) : null)
  if (!monthKey) {
    return { monthKey: null, monthLabel: null, classesInMonth: 0, estimatedAmountCents: 0 }
  }

  const monthStartOffering = { ...offering, firstClassDate: `${monthKey}-01` }
  // 6 classes is a bounded lookahead — a weekly cadence can produce at most
  // 5 class dates in any calendar month, so 6 guarantees full coverage of
  // `referenceMonthKey` without generating an open-ended schedule.
  const schedule = scheduleForOfferingAndClassCount(monthStartOffering, 6)
  const classesInMonth = schedule.classDates.filter(c => monthKeyOf(c.date) === monthKey).length
  const estimatedAmountCents = resolvePackagePricing(regularPkg, 'recurring_monthly', { classesInMonth }).payableSubtotalCents

  return { monthKey, monthLabel: monthLabelOf(monthKey), classesInMonth, estimatedAmountCents }
}
