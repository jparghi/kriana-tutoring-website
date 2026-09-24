import type { Metadata } from "next"
import { MediaConsentPage } from "../../components/consent/media-consent-page"
import { siteUrl } from "../../lib/seo"
import { GENERAL_MEDIA_CONSENT } from "../../lib/media-consent"
import { ROBOTICS_PATH } from "../../lib/site-links"

export const metadata: Metadata = {
  title: { absolute: "Photo & Media Consent | Young Engineers Kanata" },
  description: "Parent / Guardian Photo & Media Consent Form for Young Engineers activities operated by Kriana Tutoring.",
  alternates: { canonical: `${siteUrl}/consent` },
  // Shared directly with families, not something to surface in search.
  robots: { index: false, follow: true },
}

// Evergreen consent for any Young Engineers activity — not tied to one event.
// Event-specific consent (with date, venue and session) lives at /demo/consent.
export default function GeneralMediaConsentPage() {
  const context = GENERAL_MEDIA_CONSENT
  return (
    <MediaConsentPage
      context={{ id: context.id, sessions: [] }}
      details={[
        { label: "Applies to", value: context.appliesTo, wide: true },
        { label: "Franchisee", value: context.franchisee },
        { label: "Operated by", value: context.operatedBy },
      ]}
      backHref={ROBOTICS_PATH}
      backLabel="Back to Young Engineers programs"
    />
  )
}
