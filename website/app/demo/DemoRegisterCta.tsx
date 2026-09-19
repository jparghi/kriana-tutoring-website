'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { trackEvent, type FunnelEvent } from '../../lib/analytics'

// Thin client wrapper around the CTA <Link> — only the click handler needs
// to run in the browser; everything else about this button is static markup
// rendered server-side by app/demo/page.tsx. Used for every tracked CTA on
// /demo: the demo booking link, the "Join the Waitlist" link, the evergreen
// page's in-page waitlist anchor, and the regular-classes link.
//
// `content` is an optional non-sensitive placement label ('hero', 'footer',
// …) so the same event fired from several places on one page stays
// distinguishable in the funnel.
export function DemoRegisterCta({
  href,
  offeringId,
  className,
  style,
  label = 'Reserve My Child’s Spot',
  eventName = 'demo_registration_click',
  content,
}: {
  href: string
  offeringId: string
  className?: string
  style?: CSSProperties
  label?: string
  eventName?: FunnelEvent
  content?: string
}) {
  return (
    <Link
      href={href}
      onClick={() => trackEvent(eventName, { offeringId, ...(content ? { content } : {}) })}
      className={className}
      style={style}
    >
      {label}
    </Link>
  )
}
