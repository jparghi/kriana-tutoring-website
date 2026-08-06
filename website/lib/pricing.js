// Canonical program-discount pricing math. This is the single source of
// truth for applying a program's promotional discount to a base price —
// imported by both Next.js (client + server components, via lib/booking.ts)
// and Netlify Functions (submit-birthday-request.js). Never duplicate this
// arithmetic elsewhere; a client-supplied price is never trusted, the server
// always re-derives it from the program record.

export function formatPriceCents(cents) {
  return `$${(cents / 100).toFixed(2)}`
}

/** Applies a program's promotional discount (if active) to a base price. */
export function applyProgramDiscount(baseCents, program) {
  if (!program?.discountActive || !program.discountValue || baseCents <= 0) {
    return { active: false, label: '', finalCents: baseCents }
  }
  const finalCents = program.discountType === 'amount'
    ? Math.max(0, baseCents - Number(program.discountValue))
    : Math.max(0, Math.round(baseCents * (1 - Math.min(100, Math.max(0, Number(program.discountValue))) / 100)))
  return { active: finalCents < baseCents, label: program.discountLabel || 'Promotion', finalCents }
}
