// Meta (Facebook/Instagram) Pixel helpers. The base code is loaded once, site
// wide, by components/meta-pixel.tsx — and only when NEXT_PUBLIC_META_PIXEL_ID
// is set (Netlify env var). Without it every helper here is a no-op.
//
// Never send parent/child names, emails, phone numbers, or ages to Meta.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || ''

type Fbq = (...args: unknown[]) => void

function getFbq(): Fbq | null {
  if (typeof window === 'undefined' || !META_PIXEL_ID) return null
  const fbq = (window as unknown as { fbq?: Fbq }).fbq
  return typeof fbq === 'function' ? fbq : null
}

const FIRED_KEY_PREFIX = 'kt_meta_cr_'

// CompleteRegistration — call ONLY after the server has confirmed the event
// registration was saved (it does not mean payment was received; payment is
// verified later from the Interac reference). Fires at most once per
// registration: the registration id is remembered in sessionStorage so a
// retried/double submit that returns the same registration (the server keys
// it on clientRequestId) doesn't re-fire.
//
// No `Purchase` event is sent from the site: payment is confirmed manually by
// an admin, never in the parent's browser.
export function trackMetaCompleteRegistration(registrationId: string | null | undefined) {
  const fbq = getFbq()
  if (!fbq) return

  const key = registrationId ? `${FIRED_KEY_PREFIX}${registrationId}` : null
  if (key) {
    try {
      if (window.sessionStorage.getItem(key)) return
      window.sessionStorage.setItem(key, '1')
    } catch {
      // Storage blocked (private mode etc.) — still fire once for this submit.
    }
  }

  fbq('track', 'CompleteRegistration')
}
