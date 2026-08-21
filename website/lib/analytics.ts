// Allowlisted marketing-attribution query params for the /demo funnel — the
// only params ever read off a URL, forwarded between pages, or sent to the
// server. `ref` is used for flyer/QR links; it's folded into `source`
// client-side (see buildDemoAttribution in the register page) before
// anything is sent to the server, since the stored schema has no separate
// `ref` slot.
export const ALLOWED_ATTRIBUTION_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'] as const

// Internal funnel-event dispatcher for the /demo marketing funnel. No GA4,
// Meta Pixel, or GTM script is loaded by this site today — trackEvent()
// pushes to window.dataLayer only if something else already defines it
// (currently nothing does, so this is a no-op in production until an
// analytics loader is added, at which point nothing here needs to change).
//
// Never pass parent/child names, emails, phone numbers, or ages — only
// non-sensitive campaign identifiers.
export type FunnelEvent =
  | 'demo_landing_view'
  | 'demo_registration_click'
  | 'demo_registration_started'
  | 'demo_registration_submitted'
  | 'demo_payment_instructions_viewed'

export interface FunnelEventData {
  campaignId?: string | null
  source?: string | null
  medium?: string | null
  content?: string | null
  offeringId?: string | null
  eventId?: string | null
}

export function trackEvent(event: FunnelEvent, data: FunnelEventData = {}) {
  const payload = { event, ...data }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[trackEvent]', payload)
  }

  if (typeof window !== 'undefined' && Array.isArray((window as any).dataLayer)) {
    ;(window as any).dataLayer.push(payload)
  }
}
