// The payment schedule written when a parent picks Pay in Full or the monthly
// plan on the learning-path agreement page: one row per e-Transfer, due
// monthly from the day they choose. Mirrors buildPaymentSchedule in the
// portal (src/lib/paymentSchedule.js), where staff mark each row received —
// keep the two in step.

// Ontario HST, as in the portal's e-Transfer instructions.
export const HST_RATE = 0.13
export const withHst = cents => cents + Math.round(cents * HST_RATE)

/** Today in Ottawa, as YYYY-MM-DD. */
export function todayIso(now = new Date()) {
  return now.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })
}

/** `isoDate` plus `months`, keeping the day of month where it exists. */
export function addMonths(isoDate, months) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const target = new Date(Date.UTC(year, month - 1 + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(day, lastDay))
  return target.toISOString().slice(0, 10)
}

/** `count` rows splitting `totalCents` (before tax); the last row takes the
 * remainder so the rows add up to the total before and after HST. */
export function buildPaymentSchedule({ totalCents, count, installmentAmountCents = null, firstDueDate }) {
  const n = Math.max(1, count || 1)
  const each = n === 1 ? totalCents : (installmentAmountCents ?? Math.round(totalCents / n))
  const totalWithHstCents = withHst(totalCents)
  const rows = []
  let preTax = 0
  let withTax = 0
  for (let i = 0; i < n; i += 1) {
    const last = i === n - 1
    const amountCents = last ? totalCents - preTax : each
    const rowTotalCents = last ? totalWithHstCents - withTax : withHst(amountCents)
    preTax += amountCents
    withTax += rowTotalCents
    rows.push({
      number: i + 1,
      amountCents,
      totalCents: rowTotalCents,
      dueDate: addMonths(firstDueDate, i),
      status: 'due',
      receivedOn: null,
      receivedCents: null,
      invoiceId: null,
      invoiceNumber: null,
    })
  }
  return rows
}
