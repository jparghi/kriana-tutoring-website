// Client-safe (no Node built-ins) — imported by both server code and the
// booking pages (e.g. app/booking/[programId]/page.tsx, a client component).
// The crypto-based child eligibility hash lives in the sibling
// lib/demo-eligibility-crypto.js specifically so this file stays importable
// from browser bundles; importing node:crypto here broke the Next.js
// webpack build for any client component that imports this module.

// The 3 programs enrolled in the $10 Young Engineers Demo Registration
// product, keyed by their real Firestore `programs/{id}` document ID (this
// project uses Firestore auto-generated IDs, not slugs — these are NOT the
// program titles or slugs, they must be updated here if a program is ever
// deleted and recreated). This is the FIRST of two independent eligibility
// checks — see submit-demo-registration.js's validateDemoCatalogueRequest,
// which also requires the authoritative `programs/{programId}` Firestore doc
// to carry `demoEligible === true`. Never trust this static allowlist alone:
// a future program config change (e.g. temporarily pausing demos for one
// program) must be able to revoke eligibility without a code deploy, so the
// Firestore flag is the final authority and this list is only a first-line,
// defense-in-depth filter.
export const DEMO_ELIGIBLE_PROGRAM_IDS = Object.freeze([
  'cCdBSnKOgTBcO4ZIPXs4', // Smartivo
  'lqA6LK62gr7AphDOpesA', // Bricks Challenge
  'XzltkMNsZwofCqArSJ3z', // Algo Play
  'young-engineers-demo-kanata-sep-2026', // Sept 12, 2026 Kanata demo — a standalone campaign program, not tied to any regular product
])

export function isDemoEligibleProgramId(id) {
  return DEMO_ELIGIBLE_PROGRAM_IDS.includes(id)
}
