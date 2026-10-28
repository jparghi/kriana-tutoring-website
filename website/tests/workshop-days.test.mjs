import test from 'node:test'
import assert from 'node:assert/strict'

import { eventDateLabel, publicSeatsLeft, resolveDemoHub, workshopDays } from '../lib/demo-hub.js'

// Mirrors the Nov 2026 PA/PD Days entry in data/demos.ts and the offerings in
// scripts/seed-pa-pd-days-nov-2026-offerings.mjs.
const session = (date, theme, from, to, part, ebEnds) => ({
  label: `${date} · ${from}`,
  theme,
  offeringId: `ye-pa-pd-${date}-${part}`,
  startIso: `${date}T${from}:00-05:00`,
  endIso: `${date}T${to}:00-05:00`,
  earlyBirdEndsIso: ebEnds,
})
const EB_20 = '2026-11-11T00:00:00-05:00'
const EB_23 = '2026-11-14T00:00:00-05:00'
const event = {
  id: 'nov', date: '2026-11-20', status: 'REGISTRATION_OPEN', price: 39, earlyBird: { price: 34, endsIso: EB_20 }, plusTax: true,
  themes: { cm: {} },
  sessions: [
    session('2026-11-20', 'cm', '09:30', '12:30', 'am', EB_20),
    session('2026-11-20', 'cm', '13:30', '16:30', 'pm', EB_20),
    session('2026-11-23', 'cm', '09:30', '12:30', 'am', EB_23),
  ],
}
const offering = (ebEnds, counts = {}) => ({
  capacity: 10, confirmedCount: 0, heldCount: 0, ...counts,
  tuitionCents: 3900, earlyBirdTuitionCents: 3400, earlyBirdEndsAt: new Date(ebEnds).toISOString(), taxRate: 0.13,
})
const offerings = (counts = {}) => ({
  'ye-pa-pd-2026-11-20-am': offering(EB_20, counts['20-am']),
  'ye-pa-pd-2026-11-20-pm': offering(EB_20, counts['20-pm']),
  'ye-pa-pd-2026-11-23-am': offering(EB_23, counts['23-am']),
})
const allOpen = Object.fromEntries(event.sessions.map(s => [s.offeringId, { status: 'open', waitlistOpen: true }]))

function days(now, { live = allOpen, docs = offerings() } = {}) {
  const hub = resolveDemoHub([event], live, now)
  return workshopDays(event, hub.sessions, docs, now)
}
const at = iso => Date.parse(iso)
const byId = (result, id) => result.flatMap(d => d.sessions).find(s => s.offeringId === id)

test('three sessions group into two dates: Nov 20 morning + afternoon, Nov 23 morning only', () => {
  const result = days(at('2026-10-28T12:00:00-04:00'))
  assert.deepEqual(result.map(d => [d.date, d.weekday, d.label]), [['2026-11-20', 'Friday', 'Nov 20'], ['2026-11-23', 'Monday', 'Nov 23']])
  assert.deepEqual(result.map(d => d.sessions.map(s => [s.part, s.time])), [
    [['Morning', '09:30'], ['Afternoon', '13:30']],
    [['Morning', '09:30']],
  ])
  // The selected date stays tied to its own offerings.
  assert.deepEqual(result[1].sessions.map(s => s.offeringId), ['ye-pa-pd-2026-11-23-am'])
})

test('early bird: $34 + HST = $38.42 through the end of Nov 10 for Nov 20 sessions', () => {
  const s = byId(days(at('2026-11-10T23:59:59-05:00')), 'ye-pa-pd-2026-11-20-am')
  assert.deepEqual([s.subtotalCents, s.taxCents, s.priceCents, s.earlyBirdUntil], [3400, 442, 3842, 'Nov 10'])
})

test('regular: $39 + HST = $44.07 from Nov 11 for Nov 20, while Nov 23 is still early bird until Nov 13', () => {
  const result = days(at('2026-11-11T00:00:00-05:00'))
  const nov20 = byId(result, 'ye-pa-pd-2026-11-20-pm')
  const nov23 = byId(result, 'ye-pa-pd-2026-11-23-am')
  assert.deepEqual([nov20.subtotalCents, nov20.taxCents, nov20.priceCents, nov20.earlyBirdUntil], [3900, 507, 4407, null])
  assert.deepEqual([nov23.priceCents, nov23.earlyBirdUntil], [3842, 'Nov 13'])
})

test('Nov 23 sessions switch to regular at the start of Nov 14', () => {
  assert.equal(byId(days(at('2026-11-13T23:59:59-05:00')), 'ye-pa-pd-2026-11-23-am').priceCents, 3842)
  assert.equal(byId(days(at('2026-11-14T00:00:00-05:00')), 'ye-pa-pd-2026-11-23-am').priceCents, 4407)
})

test('seats left shows only at 3 or fewer, counting unpaid holds', () => {
  const now = at('2026-10-28T12:00:00-04:00')
  const result = days(now, { docs: offerings({ '20-am': { confirmedCount: 5, heldCount: 2 }, '20-pm': { confirmedCount: 6 }, '23-am': { heldCount: 9 } }) })
  assert.equal(byId(result, 'ye-pa-pd-2026-11-20-am').seatsLeft, 3) // 5 paid + 2 held
  assert.equal(byId(result, 'ye-pa-pd-2026-11-20-pm').seatsLeft, null) // 4 left: not shown
  assert.equal(byId(result, 'ye-pa-pd-2026-11-23-am').seatsLeft, 1) // holds alone
})

test('a full session offers its waitlist and shows no count; the others stay open', () => {
  const live = { ...allOpen, 'ye-pa-pd-2026-11-20-am': { status: 'full', waitlistOpen: true } }
  const result = days(at('2026-10-28T12:00:00-04:00'), { live, docs: offerings({ '20-am': { confirmedCount: 8, heldCount: 2 } }) })
  const full = byId(result, 'ye-pa-pd-2026-11-20-am')
  assert.deepEqual([full.state, full.waitlistOpen, full.seatsLeft], ['full', true, null])
  assert.deepEqual(result.flatMap(d => d.sessions).filter(s => s.state === 'open').length, 2)
})

test('unreadable offering: session is unavailable, price falls back to config', () => {
  const live = { ...allOpen }
  delete live['ye-pa-pd-2026-11-23-am']
  const docs = offerings()
  delete docs['ye-pa-pd-2026-11-23-am']
  const s = byId(days(at('2026-11-12T12:00:00-05:00'), { live, docs }), 'ye-pa-pd-2026-11-23-am')
  assert.equal(s.state, 'unavailable')
  assert.deepEqual([s.subtotalCents, s.priceCents, s.earlyBirdUntil], [3400, 3842, 'Nov 13'])
})

test('publicSeatsLeft rejects inconsistent counters', () => {
  assert.equal(publicSeatsLeft({ capacity: 10, confirmedCount: 9, heldCount: 3 }), null)
  assert.equal(publicSeatsLeft({ capacity: 0 }), null)
  assert.equal(publicSeatsLeft(null), null)
  assert.equal(publicSeatsLeft({ capacity: 10, confirmedCount: 10 }), null) // full is a state, not "0 left"
})

test('eventDateLabel covers multi-date events and keeps single-date output', () => {
  assert.equal(eventDateLabel(event, 'long'), 'November 20 & 23')
  assert.equal(eventDateLabel(event, 'short'), 'Nov 20 & 23')
  assert.equal(eventDateLabel(event, 'full'), 'Friday, November 20, 2026 & Monday, November 23, 2026')
  const single = { date: '2026-10-02', sessions: [{ startIso: '2026-10-02T10:30:00-04:00' }] }
  assert.equal(eventDateLabel(single, 'full'), 'Friday, October 2, 2026')
})
