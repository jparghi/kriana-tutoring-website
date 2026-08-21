'use client'

import Link from 'next/link'
import { trackEvent } from '../../lib/analytics'

// Thin client wrapper around the CTA <Link> — only the click handler needs
// to run in the browser; everything else about this button is static markup
// rendered server-side by app/demo/page.tsx.
export function DemoRegisterCta({ href, offeringId, className }: { href: string; offeringId: string; className?: string }) {
  return (
    <Link
      href={href}
      onClick={() => trackEvent('demo_registration_click', { offeringId })}
      className={className}
    >
      Reserve My Child&apos;s Spot — $10
    </Link>
  )
}
