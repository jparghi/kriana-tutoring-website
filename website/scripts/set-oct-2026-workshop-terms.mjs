#!/usr/bin/env node
/**
 * Re-labels the Oct 2, 2026 Stittsville event as a PD Day STEM Workshop in
 * Firestore, so the register form, e-transfer page and emails use workshop
 * wording (they read `eventType` from the offering). Writes ONLY these fields:
 *   programs/young-engineers-demo-stittsville-oct-2026        title
 *   programOfferings/…-am and …-pm                             eventTitle, eventType
 * Capacity, counts, registrations and everything else are untouched.
 *
 * Dry run (default):  node scripts/set-oct-2026-workshop-terms.mjs
 * Apply:              node scripts/set-oct-2026-workshop-terms.mjs --apply
 */
import { readFileSync } from 'node:fs'
import { Timestamp } from 'firebase-admin/firestore'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { getAdminDb } = await import(new URL('../netlify/functions/_lib/firebase-admin.js', import.meta.url))

const APPLY = process.argv.includes('--apply')
const TITLE = 'Young Engineers PD Day STEM Workshop'
const PROGRAM_ID = 'young-engineers-demo-stittsville-oct-2026'
const db = getAdminDb()
console.log(`Project: ${process.env.FIREBASE_PROJECT_ID}   Mode: ${APPLY ? 'APPLY' : 'DRY RUN (nothing written)'}`)

const updates = [
  { ref: db.collection('programs').doc(PROGRAM_ID), patch: { title: TITLE } },
  ...['am', 'pm'].map(s => ({
    ref: db.collection('programOfferings').doc(`${PROGRAM_ID}-${s}`),
    patch: { eventTitle: TITLE, eventType: 'PD_DAY_WORKSHOP' },
  })),
]
for (const { ref, patch } of updates) {
  const snap = await ref.get()
  if (!snap.exists) { console.log(`\n${ref.path} -> MISSING, skipped`); continue }
  const before = Object.fromEntries(Object.keys(patch).map(k => [k, snap.data()[k] ?? null]))
  console.log(`\n${ref.path}\n  before: ${JSON.stringify(before)}\n  after:  ${JSON.stringify(patch)}`)
  if (APPLY) await ref.update({ ...patch, updatedAt: Timestamp.now() })
}
console.log(APPLY ? '\nDone.' : '\nDry run only. Re-run with --apply to write.')
