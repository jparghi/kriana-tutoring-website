// Canonical robotics class-package catalogue. This is the single source of
// truth for package pricing — imported by both Next.js (client + server
// components) and Netlify Functions (submit-enrollment-request.js). Never
// duplicate these numbers elsewhere; a client-supplied price is never
// trusted, only a packageId is, and the server resolves everything here.

export const ROBOTICS_PACKAGES = Object.freeze([
  Object.freeze({
    id: 'explorer',
    name: 'Explorer',
    classCount: 10,
    perClassCents: 3000,
    subtotalCents: 30000,
    currency: 'CAD',
    badge: null,
    sortOrder: 1,
  }),
  Object.freeze({
    id: 'builder',
    name: 'Builder',
    classCount: 20,
    perClassCents: 2800,
    subtotalCents: 56000,
    currency: 'CAD',
    badge: 'Most Popular',
    sortOrder: 2,
  }),
  Object.freeze({
    id: 'engineer',
    name: 'Engineer',
    classCount: 36,
    perClassCents: 2600,
    subtotalCents: 93600,
    currency: 'CAD',
    badge: 'Best Value',
    sortOrder: 3,
  }),
])

// Fails fast (at import time) if any package's arithmetic is inconsistent,
// rather than silently mis-invoicing a family later.
for (const pkg of ROBOTICS_PACKAGES) {
  const expected = pkg.classCount * pkg.perClassCents
  if (expected !== pkg.subtotalCents) {
    throw new Error(
      `Robotics package "${pkg.id}" is inconsistent: ${pkg.classCount} × ${pkg.perClassCents} = ${expected}, but subtotalCents is ${pkg.subtotalCents}.`
    )
  }
}

const PACKAGES_BY_ID = new Map(ROBOTICS_PACKAGES.map(pkg => [pkg.id, pkg]))

export function isValidPackageId(value) {
  return typeof value === 'string' && PACKAGES_BY_ID.has(value)
}

/** Canonical lookup — the only place package pricing should be resolved from an ID. */
export function getRoboticsPackage(packageId) {
  return PACKAGES_BY_ID.get(packageId) ?? null
}

/** Builds the immutable snapshot stored on a registration/waitlist document. */
export function buildPackageSnapshot(packageId) {
  const pkg = getRoboticsPackage(packageId)
  if (!pkg) return null
  return {
    version: 1,
    id: pkg.id,
    name: pkg.name,
    classCount: pkg.classCount,
    perClassCents: pkg.perClassCents,
    subtotalCents: pkg.subtotalCents,
    currency: pkg.currency,
  }
}
