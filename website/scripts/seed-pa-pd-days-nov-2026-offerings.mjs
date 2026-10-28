#!/usr/bin/env node
/**
 * Creates the Nov 20 & Nov 23, 2026 Stittsville PA/PD Day workshops in
 * Firestore: one program plus three offerings of Crazy Comical Machines —
 * Nov 20 9:30 AM–12:30 PM and 1:30–4:30 PM, Nov 23 9:30 AM–12:30 PM. Each offering is
 * its own session with capacity 10, its own waitlist and its own early-bird
 * deadline:
 *   - $34 early bird / $39 regular, 13% HST added at registration (taxRate)
 *     — $38.42 / $44.07 total. See getDemoPricing.
 *   - Early bird runs through the end of Nov 10 for the Nov 20 sessions and
 *     the end of Nov 13 for the Nov 23 sessions (Ottawa time, EST).
 *   - demoCreditEnabled: false — not credited toward enrollment.
 *   - eligibilityScope = the offering id, so a child can book several
 *     sessions (AM + PM, or both dates) but never the same session twice.
 *
 * Session ids and times must match data/demos.ts. Shapes mirror
 * seed-halloween-oct-2026-offering.mjs. Existing docs are never overwritten.
 *
 * Dry run (default — reads only, prints what would be written):
 *   node scripts/seed-pa-pd-days-nov-2026-offerings.mjs
 * Apply (writes to the Firestore project in .env.local):
 *   node scripts/seed-pa-pd-days-nov-2026-offerings.mjs --apply
 */
import { readFileSync } from 'node:fs'
import { Timestamp } from 'firebase-admin/firestore'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { getAdminDb } = await import(new URL('../netlify/functions/_lib/firebase-admin.js', import.meta.url))

const APPLY = process.argv.includes('--apply')
const PROGRAM_ID = 'young-engineers-pa-pd-days-stittsville-nov-2026'
const TITLE = 'Young Engineers PA/PD Day Workshop'
const LOCATION = '205 Metric Circle, Stittsville, ON K2V 0L3'

const program = {
  demoEligible: true,
  publicCatalogVersion: 1,
  category: 'Demo Class',
  isActive: true,
  learnMoreUrl: 'https://www.krianatutoring.com/robotics',
  title: TITLE,
  ageRange: '6-12',
}

// November is EST (UTC-5) — DST ended Nov 1.
const SESSIONS = [
  { id: 'ye-pa-pd-2026-11-20-am', title: 'Crazy Comical Machines: Fri, Nov 20 (Morning)', start: '2026-11-20T14:30:00Z', end: '2026-11-20T17:30:00Z', earlyBirdEnds: '2026-11-11T05:00:00Z' },
  { id: 'ye-pa-pd-2026-11-20-pm', title: 'Crazy Comical Machines: Fri, Nov 20 (Afternoon)', start: '2026-11-20T18:30:00Z', end: '2026-11-20T21:30:00Z', earlyBirdEnds: '2026-11-11T05:00:00Z' },
  { id: 'ye-pa-pd-2026-11-23-am', title: 'Crazy Comical Machines: Mon, Nov 23 (Morning)', start: '2026-11-23T14:30:00Z', end: '2026-11-23T17:30:00Z', earlyBirdEnds: '2026-11-14T05:00:00Z' },
]

function offering(session) {
  return {
    offeringType: 'demo',
    isPublished: true,
    timezone: 'America/Toronto',
    publicCatalogVersion: 1,
    programId: PROGRAM_ID,
    status: 'Open',
    eventTitle: session.title,
    eventType: 'PD_DAY_WORKSHOP',
    location: LOCATION,
    eventStartAt: Timestamp.fromDate(new Date(session.start)),
    eventEndAt: Timestamp.fromDate(new Date(session.end)),
    enrollmentOpenAt: Timestamp.now(),
    enrollmentCloseAt: Timestamp.fromDate(new Date(session.start)),
    capacity: 10,
    confirmedCount: 0,
    heldCount: 0,
    currency: 'CAD',
    tuitionCents: 3900,
    earlyBirdTuitionCents: 3400,
    earlyBirdEndsAt: Timestamp.fromDate(new Date(session.earlyBirdEnds)),
    taxRate: 0.13,
    demoCreditEnabled: false,
    eligibilityScope: session.id,
    publicRegistrationPaused: false,
    waitlistEnabled: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
}

const db = getAdminDb()
console.log(`Project: ${process.env.FIREBASE_PROJECT_ID}   Mode: ${APPLY ? 'APPLY' : 'DRY RUN (nothing written)'}`)

const plan = [
  { ref: db.collection('programs').doc(PROGRAM_ID), data: program },
  ...SESSIONS.map(session => ({ ref: db.collection('programOfferings').doc(session.id), data: offering(session) })),
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
