#!/usr/bin/env node
/**
 * Sets the Nov 20 & Nov 23, 2026 PA/PD Day workshop sessions to a flat $34
 * (no HST) and removes the early bird. Writes ONLY these fields
 * on the three programOfferings docs:
 *   tuitionCents = 3400, taxRate = 0, earlyBirdTuitionCents + earlyBirdEndsAt deleted
 * Capacity, counts, registrations and everything else are untouched.
 * Existing registrations keep the amount they were charged.
 *
 * Dry run (default):  node scripts/set-pa-pd-nov-2026-price-34.mjs
 * Apply:              node scripts/set-pa-pd-nov-2026-price-34.mjs --apply
 */
import { readFileSync } from 'node:fs'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { getAdminDb } = await import(new URL('../netlify/functions/_lib/firebase-admin.js', import.meta.url))

const APPLY = process.argv.includes('--apply')
const IDS = ['ye-pa-pd-2026-11-20-am', 'ye-pa-pd-2026-11-20-pm', 'ye-pa-pd-2026-11-23-am']
const FIELDS = ['tuitionCents', 'taxRate', 'earlyBirdTuitionCents', 'earlyBirdEndsAt']

const db = getAdminDb()
console.log(`Project: ${process.env.FIREBASE_PROJECT_ID}   Mode: ${APPLY ? 'APPLY' : 'DRY RUN (nothing written)'}`)

for (const id of IDS) {
  const ref = db.collection('programOfferings').doc(id)
  const snap = await ref.get()
  if (!snap.exists) { console.log(`\n${ref.path} -> MISSING, skipped`); continue }
  const data = snap.data()
  const before = Object.fromEntries(FIELDS.map(k => [k, data[k]?.toDate ? data[k].toDate().toISOString() : data[k] ?? null]))
  console.log(`\n${ref.path}\n  before: ${JSON.stringify(before)}\n  after:  {"tuitionCents":3400,"taxRate":0,"earlyBirdTuitionCents":null,"earlyBirdEndsAt":null}`)
  if (APPLY) {
    await ref.update({
      tuitionCents: 3400,
      taxRate: 0,
      earlyBirdTuitionCents: FieldValue.delete(),
      earlyBirdEndsAt: FieldValue.delete(),
      updatedAt: Timestamp.now(),
    })
  }
}
console.log(APPLY ? '\nDone.' : '\nDry run only. Re-run with --apply to write.')
