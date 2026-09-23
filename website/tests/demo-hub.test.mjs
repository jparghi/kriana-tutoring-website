import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveDemoHub, formatDemoDate, partialSellout, sessionShortName } from '../lib/demo-hub.js'

const session = (date, from, to, offeringId) => ({ label: `${from}`, offeringId, startIso: `${date}T${from}:00-04:00`, endIso: `${date}T${to}:00-04:00` })
const past = { id: 'sep', date: '2026-09-12', status: 'COMPLETED', sessions: [session('2026-09-12', '10:30', '11:30')] }
const next = {
  id: 'oct', date: '2026-10-02', status: 'REGISTRATION_OPEN',
  sessions: [session('2026-10-02', '10:30', '12:00', 'am'), session('2026-10-02', '14:00', '15:30', 'pm')],
}
const NOW = Date.parse('2026-09-19T12:00:00-04:00')
const open = { status: 'open', waitlistOpen: true }
const full = { status: 'full', waitlistOpen: true }

test('active is the soonest not-completed demo; completed go to history', () => {
  const hub = resolveDemoHub([past, next], { am: open, pm: open }, NOW)
  assert.equal(hub.active.id, 'oct')
  assert.deepEqual(hub.past.map(d => d.id), ['sep'])
})

test('fails closed: sessions without a live offering are never registrable', () => {
  const hub = resolveDemoHub([past, next], null, NOW)
  assert.equal(hub.canRegister, false)
  assert.equal(hub.status, 'REGISTRATION_OPEN') // configured, but nothing bookable
  assert.deepEqual(hub.sessions.map(s => s.state), ['unavailable', 'unavailable'])
})

test('both sessions open', () => {
  const hub = resolveDemoHub([past, next], { am: open, pm: open }, NOW)
  assert.equal(hub.canRegister, true)
  assert.equal(hub.status, 'REGISTRATION_OPEN')
})

test('one session full: the other stays bookable, the full one offers its waitlist', () => {
  const hub = resolveDemoHub([past, next], { am: full, pm: open }, NOW)
  assert.equal(hub.status, 'REGISTRATION_OPEN')
  assert.equal(hub.canRegister, true)
  assert.deepEqual(hub.sessions.map(s => [s.state, s.waitlistOpen]), [['full', true], ['open', true]])
})

test('partial sell-out names the sold-out and the still-open session', () => {
  const named = { ...next, sessions: [{ ...next.sessions[0], name: 'Morning Workshop' }, { ...next.sessions[1], name: 'Afternoon Workshop' }] }
  const hub = resolveDemoHub([past, named], { am: full, pm: open }, NOW)
  const partial = partialSellout(hub.sessions)
  assert.equal(partial.soldOut.offeringId, 'am')
  assert.equal(partial.open.offeringId, 'pm')
  assert.equal(sessionShortName(partial.soldOut), 'Morning')
  assert.equal(sessionShortName(partial.open), 'Afternoon')
})

test('no partial sell-out while everything is open or everything is full', () => {
  assert.equal(partialSellout(resolveDemoHub([past, next], { am: open, pm: open }, NOW).sessions), null)
  assert.equal(partialSellout(resolveDemoHub([past, next], { am: full, pm: full }, NOW).sessions), null)
})

test('all sessions full: SOLD_OUT and no registration', () => {
  const hub = resolveDemoHub([past, next], { am: full, pm: full }, NOW)
  assert.equal(hub.status, 'SOLD_OUT')
  assert.equal(hub.canRegister, false)
})

test('pinning SOLD_OUT in the data stops booking even if offerings are open', () => {
  const hub = resolveDemoHub([past, { ...next, status: 'SOLD_OUT' }], { am: open, pm: open }, NOW)
  assert.equal(hub.status, 'SOLD_OUT')
  assert.equal(hub.canRegister, false)
})

test('all booking windows closed moves the demo into history', () => {
  const hub = resolveDemoHub([past, next], { am: { status: 'closed' }, pm: { status: 'closed' } }, NOW)
  assert.equal(hub.active, null)
  assert.equal(hub.status, 'WAITLIST')
  assert.deepEqual(hub.past.map(d => d.id), ['oct', 'sep'])
})

test('a demo whose last session has ended is auto-completed', () => {
  const hub = resolveDemoHub([past, next], { am: open, pm: open }, Date.parse('2026-10-02T16:00:00-04:00'))
  assert.equal(hub.active, null)
  assert.equal(hub.past[0].id, 'oct')
})

test('date labels are timezone-safe', () => {
  assert.equal(formatDemoDate('2026-10-02', 'full'), 'Friday, October 2, 2026')
  assert.equal(formatDemoDate('2026-09-12'), 'September 12')
})
