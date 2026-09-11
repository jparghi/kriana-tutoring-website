'use client'

import Link from 'next/link'
import { trackEvent, type FunnelEvent } from '../../lib/analytics'

// Thin client wrapper around the CTA <Link> — only the click handler needs
// to run in the browser; everything else about this button is static markup
// rendered server-side by app/demo/page.tsx. Also used for the fully-booked
// state's "Join the Waitlist" button (same register link, different label
// and analytics event).
export function DemoRegisterCta({
  href,
  offeringId,
  className,
  label = 'Reserve My Child’s Spot — $10',
  eventName = 'demo_registration_click',
}: {
  href: string
  offeringId: string
  className?: string
  label?: string
  eventName?: FunnelEvent
}) {
  return (
    <Link
      href={href}
      onClick={() => trackEvent(eventName, { offeringId })}
      className={className}
    >
      {label}
    </Link>
  )
}
