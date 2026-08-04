export const BOOKING_FLOW_MODE = {
  REQUEST_ONLY: 'request_only',
  LEGACY_PAYMENTS: 'legacy_payments',
} as const

export type BookingFlowMode = typeof BOOKING_FLOW_MODE[keyof typeof BOOKING_FLOW_MODE]

// Payment collection is intentionally fail-closed. An unset, misspelled, or
// unsupported value always leaves the public booking flow in request-only mode.
const configuredMode = process.env.NEXT_PUBLIC_BOOKING_FLOW_MODE

export const bookingFlowMode: BookingFlowMode = configuredMode === BOOKING_FLOW_MODE.LEGACY_PAYMENTS
  ? BOOKING_FLOW_MODE.LEGACY_PAYMENTS
  : BOOKING_FLOW_MODE.REQUEST_ONLY

export const isRequestOnlyBookingFlow = bookingFlowMode === BOOKING_FLOW_MODE.REQUEST_ONLY

