#!/usr/bin/env node
/**
 * Creates the Oct 25, 2026 Stittsville Halloween STEM Workshop in Firestore:
 * one program plus one offering (10:30 AM–12:30 PM, capacity 10, waitlist on).
 *
 * Unlike the $10 demos this is a paid workshop:
 *   - $25 early bird until the end of Oct 15, then $30 (tuitionCents), with
 *     13% HST added at registration (taxRate) — see getDemoPricing.
 *   - demoCreditEnabled: false — not credited toward enrollment.
 *   - eligibilityScope — its own one-booking-per-child lock, so children who
 *     came to an earlier $10 demo can still book, and this doesn't use up
 *     their one-time demo offer.
 *
 * Shapes mirror seed-demo-oct-2026-offerings.mjs. Existing docs are never
 * overwritten.
 *
 * Dry run (default — reads only, prints what would be written):
 *   node scripts/seed-halloween-oct-2026-offering.mjs
 * Apply (writes to the Firestore project in .env.local):
 *   node scripts/seed-halloween-oct-2026-offering.mjs --apply
 */
import { readFileSync } from 'node:fs'
import { Timestamp } from 'firebase-admin/firestore'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { getAdminDb } = await import(new URL('../netlify/functions/_lib/firebase-admin.js', import.meta.url))

const APPLY = process.argv.includes('--apply')
const PROGRAM_ID = 'young-engineers-halloween-stittsville-oct-2026'
const OFFERING_ID = `${PROGRAM_ID}-offering`
const TITLE = 'Young Engineers Halloween STEM Workshop'

const program = {
  demoEligible: true,
  publicCatalogVersion: 1,
  category: 'Demo Class',
  isActive: true,
  learnMoreUrl: 'https://www.krianatutoring.com/robotics',
  title: TITLE,
  ageRange: '6-12',
}

// Oct 25, 2026 is still EDT (UTC-4); DST ends Nov 1.
const START = '2026-10-25T14:30:00Z' // 10:30 AM
const END = '2026-10-25T16:30:00Z' // 12:30 PM
const EARLY_BIRD_ENDS = '2026-10-16T04:00:00Z' // end of Oct 15, Ottawa time

const offering = {
  offeringType: 'demo',
  isPublished: true,
  timezone: 'America/Toronto',
  publicCatalogVersion: 1,
  programId: PROGRAM_ID,
  status: 'Open',
  eventTitle: TITLE,
  eventType: 'HOLIDAY_WORKSHOP',
  location: '205 Metric Circle, Stittsville, ON K2V 0L3',
  eventStartAt: Timestamp.fromDate(new Date(START)),
  eventEndAt: Timestamp.fromDate(new Date(END)),
  enrollmentOpenAt: Timestamp.now(),
  enrollmentCloseAt: Timestamp.fromDate(new Date(START)),
  capacity: 10,
  confirmedCount: 0,
  heldCount: 0,
  currency: 'CAD',
  tuitionCents: 3000,
  earlyBirdTuitionCents: 2500,
  earlyBirdEndsAt: Timestamp.fromDate(new Date(EARLY_BIRD_ENDS)),
  taxRate: 0.13,
  demoCreditEnabled: false,
  eligibilityScope: PROGRAM_ID,
  publicRegistrationPaused: false,
  waitlistEnabled: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
}

const db = getAdminDb()
console.log(`Project: ${process.env.FIREBASE_PROJECT_ID}   Mode: ${APPLY ? 'APPLY' : 'DRY RUN (nothing written)'}`)

const plan = [
  { ref: db.collection('programs').doc(PROGRAM_ID), data: program },
  { ref: db.collection('programOfferings').doc(OFFERING_ID), data: offering },
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
