import type { Metadata } from "next"
import { MediaConsentPage } from "../../../components/consent/media-consent-page"
import { siteUrl } from "../../../lib/seo"
import { CURRENT_MEDIA_CONSENT_EVENT_ID, MEDIA_CONSENT_EVENTS } from "../../../lib/media-consent"

export const metadata: Metadata = {
  title: { absolute: "Workshop Photo & Media Consent | Young Engineers Kanata" },
  description: "Parent / Guardian Photo & Media Consent Form for the Young Engineers PD Day STEM Workshop operated by Kriana Tutoring.",
  alternates: { canonical: `${siteUrl}/demo/consent` },
  // Linked from workshop emails, not something to surface in search.
  robots: { index: false, follow: true },
}

// Event-specific consent for the current workshop. ?session=am|pm pre-selects
// the session from an email link. The evergreen version lives at /consent.
export default function WorkshopMediaConsentPage({ searchParams }: { searchParams: { session?: string } }) {
  const event = MEDIA_CONSENT_EVENTS[CURRENT_MEDIA_CONSENT_EVENT_ID]
  const initialSessionId = event.sessions.some(session => session.id === searchParams.session) ? searchParams.session : ""

  return (
    <MediaConsentPage
      context={{ id: event.id, dateLabel: event.dateLabel, sessions: event.sessions }}
      details={[
        { label: "Event", value: event.title, wide: true },
        { label: "Date", value: <time dateTime={event.date}>{event.dateLabel}</time> },
        { label: "Location", value: event.address },
        { label: "Operated by", value: event.operatedBy, wide: true },
      ]}
      initialSessionId={initialSessionId}
      backHref="/demo"
      backLabel="Back to the workshop"
    />
  )
}
