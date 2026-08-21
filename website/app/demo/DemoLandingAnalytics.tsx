'use client'

import { useEffect } from 'react'
import { trackEvent } from '../../lib/analytics'

// Fires demo_landing_view once on mount. Server Components can't touch
// window, so this tiny client component is mounted once from app/demo/page.tsx
// and receives only non-sensitive campaign identifiers as props.
export function DemoLandingAnalytics({
  offeringId, source, medium, campaign, content,
}: {
  offeringId: string | null
  source: string | null
  medium: string | null
  campaign: string | null
  content: string | null
}) {
  useEffect(() => {
    trackEvent('demo_landing_view', { offeringId, source, medium, campaignId: campaign, content })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
