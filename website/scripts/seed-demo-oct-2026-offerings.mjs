#!/usr/bin/env node
/**
 * Creates the Oct 2, 2026 Stittsville demo in Firestore: one program plus one
 * offering per session (10:30 AM–12:00 PM and 2:00 PM–3:30 PM), each with its
 * own capacity and its waitlist switched on. Because capacity lives on each
 * offering, the existing register/waitlist code flips a session to its waitlist
 * form on its own once it fills (or when staff pause it with
 * set-demo-offering-public-booking.mjs).
 *
 * Shapes mirror the Sept 12 demo docs. Existing docs are never overwritten.
 *
 * Dry run (default — reads only, prints what would be written):
 *   node scripts/seed-demo-oct-2026-offerings.mjs
 * Apply (writes to the Firestore project in .env.local):
 *   node scripts/seed-demo-oct-2026-offerings.mjs --apply
 */
import { readFileSync } from 'node:fs'
import { Timestamp } from 'firebase-admin/firestore'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { getAdminDb } = await import(new URL('../netlify/functions/_lib/firebase-admin.js', import.meta.url))

const APPLY = process.argv.includes('--apply')
const CAPACITY_PER_SESSION = 8
const PROGRAM_ID = 'young-engineers-demo-stittsville-oct-2026'
const TITLE = 'Young Engineers Demo Class — Stittsville'

const program = {
  demoEligible: true,
  publicCatalogVersion: 1,
  category: 'Demo Class',
  isActive: true,
  learnMoreUrl: 'https://www.krianatutoring.com/robotics',
  title: TITLE,
  ageRange: '6-12',
}

// Oct 2, 2026 is EDT (UTC-4).
const sessions = [
  { id: `${PROGRAM_ID}-am`, start: '2026-10-02T14:30:00Z', end: '2026-10-02T16:00:00Z' },
  { id: `${PROGRAM_ID}-pm`, start: '2026-10-02T18:00:00Z', end: '2026-10-02T19:30:00Z' },
]

const offeringFor = session => ({
  offeringType: 'demo',
  isPublished: true,
  timezone: 'America/Toronto',
  publicCatalogVersion: 1,
  programId: PROGRAM_ID,
  status: 'Open',
  eventTitle: TITLE,
  location: '205 Metric Circle, Stittsville, ON K2V 0L3',
  eventStartAt: Timestamp.fromDate(new Date(session.start)),
  eventEndAt: Timestamp.fromDate(new Date(session.end)),
  enrollmentOpenAt: Timestamp.now(),
  enrollmentCloseAt: Timestamp.fromDate(new Date(session.start)),
  capacity: CAPACITY_PER_SESSION,
  confirmedCount: 0,
  heldCount: 0,
  publicRegistrationPaused: false,
  waitlistEnabled: true,
  updatedAt: Timestamp.now(),
})

const db = getAdminDb()
console.log(`Project: ${process.env.FIREBASE_PROJECT_ID}   Mode: ${APPLY ? 'APPLY' : 'DRY RUN (nothing written)'}`)

const plan = [
  { ref: db.collection('programs').doc(PROGRAM_ID), data: program },
  ...sessions.map(s => ({ ref: db.collection('programOfferings').doc(s.id), data: offeringFor(s) })),
]
for (const { ref, data } of plan) {
  const exists = (await ref.get()).exists
  console.log(`\n${ref.path}  ${exists ? '-> ALREADY EXISTS, skipped' : '-> would create'}`)
  if (!exists) {
    console.log(JSON.stringify(data, (k, v) => (v && v.toDate ? v.toDate().toISOString() : v), 2))
    if (APPLY) await ref.create(data)
  }
}
console.log(APPLY ? '\nDone.' : '\nDry run only. Re-run with --apply to write.')
