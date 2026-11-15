#!/usr/bin/env node
/**
 * Blocks (or, with --resume, re-allows) public booking for the two PA/PD Day
 * morning sessions (Fri Nov 20 AM, Mon Nov 23 AM). They are hidden on /events
 * via `hidden: true` in data/demos.ts but, as of 2026-11-15, left bookable
 * (resumed) so staff can share a direct register link. Writes ONLY publicRegistrationPaused
 * on those two programOfferings docs; the Nov 20 afternoon is untouched.
 *
 * Dry run (default):  node scripts/pause-pa-pd-nov-2026-mornings.mjs
 * Apply:              node scripts/pause-pa-pd-nov-2026-mornings.mjs --apply
 * Undo:               node scripts/pause-pa-pd-nov-2026-mornings.mjs --apply --resume
 */
import { readFileSync } from 'node:fs'
import { Timestamp } from 'firebase-admin/firestore'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { getAdminDb } = await import(new URL('../netlify/functions/_lib/firebase-admin.js', import.meta.url))

const APPLY = process.argv.includes('--apply')
const PAUSED = !process.argv.includes('--resume')
const IDS = ['ye-pa-pd-2026-11-20-am', 'ye-pa-pd-2026-11-23-am']

const db = getAdminDb()
console.log(`Project: ${process.env.FIREBASE_PROJECT_ID}   Mode: ${APPLY ? 'APPLY' : 'DRY RUN (nothing written)'}`)
for (const id of IDS) {
  const ref = db.collection('programOfferings').doc(id)
  const snap = await ref.get()
  if (!snap.exists) { console.log(`\n${ref.path} -> MISSING, skipped`); continue }
  const d = snap.data()
  console.log(`\n${ref.path}  confirmed=${d.confirmedCount ?? 0} held=${d.heldCount ?? 0}\n  publicRegistrationPaused: ${d.publicRegistrationPaused ?? false} -> ${PAUSED}`)
  if (APPLY) await ref.update({ publicRegistrationPaused: PAUSED, updatedAt: Timestamp.now() })
}
console.log(APPLY ? '\nDone.' : '\nDry run only. Re-run with --apply to write.')
