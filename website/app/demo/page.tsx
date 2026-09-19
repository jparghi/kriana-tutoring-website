import type { Metadata } from "next"
import { cache } from "react"
import { demos, type DemoEvent, type DemoStatus } from "../../data/demos"
import { demoReviews } from "../../data/demo-reviews"
import { resolveDemoCampaignOffering, resolveDemoSessionOfferings } from "../../lib/demo-campaign.server"
import { resolveDemoHub } from "../../lib/demo-hub"
import { getDemoPricing } from "../../lib/robotics-packages.js"
import { siteUrl, toJsonLd } from "../../lib/seo"
import { Footer } from "../../components/footer"
import { DemoLandingAnalytics } from "./DemoLandingAnalytics"
import { DemoWaitlistForm } from "./DemoWaitlistForm"
import { SessionReserve } from "./SessionReserve"
import { StickyReserveBar } from "./StickyReserveBar"
import {
  CONTACT_SMS_HREF, ContactButtons, CtaButton, DemoFaq, DemoHero, DemoJourney, ParentReviews, PastDemoGallery,
  PreviousDemoProof, ProgramsSection, ReserveSection, WhatChildrenDo, WhatChildrenLearn, type HubCta,
} from "./sections"
import { ROBOTICS_BOOKING_URL } from "../../lib/site-links"

// Always render per-request, never at build time — this page depends on
// live campaign/offering state (capacity, publish status, registration
// window) that must never go stale, and must never attempt a Firestore call
// during the Netlify build itself (which fails there; Firestore access is
// only expected to work in the deployed request-serving environment).
export const dynamic = "force-dynamic"

const HERO_CTA_ID = "demo-hero-cta"
const RESERVE_SECTION_ID = "reserve"
const SHARE_IMAGE_PATH = "/images/gallery/young-engineers-demo-sept-2026-v1.jpg"

// generateMetadata and the page both need the campaign — cache() dedupes the
// Firestore read to once per request.
const getCampaign = cache(() => resolveDemoCampaignOffering())

// /demo is a permanent hub, so its metadata is evergreen: it never depends on
// which demo is currently featured. Event details live in the structured data.
export async function generateMetadata(): Promise<Metadata> {
  const title = "Young Engineers Demo | Hands-On STEM for Kids | Kanata & Stittsville"
  const description =
    "Join a Young Engineers hands-on STEM demo in Kanata/Stittsville. Kids ages 6–12 build, test and explore real engineering concepts through fun interactive activities."
  return {
    // absolute: the root layout's "%s · Kriana Tutoring" template would
    // otherwise append the brand a second time.
    title: { absolute: title },
    description,
    alternates: { canonical: `${siteUrl}/demo` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/demo`,
      type: "website",
      images: [{ url: `${siteUrl}${SHARE_IMAGE_PATH}`, width: 720, height: 1280, alt: "A child building a Young Engineers model at a Kanata demo" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`${siteUrl}${SHARE_IMAGE_PATH}`] },
  }
}

// One Event per session so each time slot is its own valid, dated event.
function eventSchemas(demo: DemoEvent, status: DemoStatus, canRegister: boolean) {
  const availability = status === "SOLD_OUT" ? "SoldOut" : canRegister ? "InStock" : null
  return demo.sessions.map(session => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: demo.title,
    startDate: session.startIso,
    endDate: session.endIso,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: `Young Engineers ${demo.location}`,
      address: demo.address || demo.location,
    },
    image: [`${siteUrl}${SHARE_IMAGE_PATH}`],
    description: `Hands-on STEM, engineering and coding demo for children ages ${demo.ageRange}.`,
    ...(availability
      ? { offers: { "@type": "Offer", price: demo.price.toFixed(2), priceCurrency: "CAD", availability: `https://schema.org/${availability}`, url: `${siteUrl}/demo` } }
      : {}),
    organizer: { "@type": "Organization", name: "Kriana Tutoring", url: siteUrl },
  }))
}

// Describes real footage rather than an event — the right schema when there
// is no upcoming demo and the proof is a past one.
function highlightVideoSchema(demo: DemoEvent) {
  if (!demo.highlightVideo) return null
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `Young Engineers ${demo.location} Demo — highlights`,
    description: "Highlights from a Young Engineers STEM and robotics demo class in Kanata.",
    thumbnailUrl: `${siteUrl}${demo.highlightVideo.poster}`,
    contentUrl: `${siteUrl}${demo.highlightVideo.src}`,
    uploadDate: demo.sessions[0]?.startIso ?? demo.date,
    publisher: { "@type": "Organization", name: "Kriana Tutoring", url: siteUrl },
  }
}

// Only these query params are ever read, forwarded, or stored — see
// lib/analytics.ts's ALLOWED_ATTRIBUTION_PARAMS (kept as a literal list here
// too since Server Component searchParams aren't a URLSearchParams instance).
const ALLOWED_ATTRIBUTION_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"] as const

function pickAttributionParams(searchParams: Record<string, string | string[] | undefined>) {
  const out: Record<string, string> = {}
  for (const key of ALLOWED_ATTRIBUTION_PARAMS) {
    const raw = searchParams[key]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (typeof value === "string" && value.trim()) out[key] = value.trim().slice(0, 100)
  }
  return out
}

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  // Generic "next demo" waitlist target (used only when there's no upcoming
  // demo) and the analytics offering id — still the env-configured campaign.
  const campaign = await getCampaign()
  const campaignOfferingId = campaign.offeringId ?? ""
  const campaignProgramId = campaign.programId ?? ""

  // Live state of every upcoming session's own offering. A failed read fails
  // closed: sessions read as unavailable and the page falls back to call/text.
  const liveSessions: Record<string, { status: string; waitlistOpen?: boolean; offering?: any }> = {}
  for (const demo of demos) {
    if (!demo.programId) continue
    try {
      Object.assign(liveSessions, await resolveDemoSessionOfferings(demo.programId, demo.sessions.map(s => s.offeringId ?? "")))
    } catch (error) {
      console.error("demo session state unavailable", error)
    }
  }

  const { active, status, sessions, canRegister, past } = resolveDemoHub(demos, liveSessions)
  const attribution = pickAttributionParams(searchParams)
  const attributionQuery = new URLSearchParams(attribution).toString()

  // A join needs a real offering to queue against, and that offering's own
  // waitlistEnabled switch — exactly what submit-demo-waitlist.js enforces.
  const canJoinWaitlist = campaign.waitlistOpen === true && Boolean(campaignOfferingId && campaignProgramId)

  // Price comes from the first bookable session's offering (what the register
  // endpoint will charge), else the configured price for display only.
  const priceOffering = sessions.find(s => s.state === "open" && s.offeringId && liveSessions[s.offeringId]?.offering)
  const priceCents = priceOffering?.offeringId
    ? getDemoPricing(liveSessions[priceOffering.offeringId].offering).priceCents
    : Math.round((active?.price ?? 10) * 100)
  const priceDisplay = `$${priceCents % 100 === 0 ? priceCents / 100 : (priceCents / 100).toFixed(2)}`

  // Anything the parent can act on for a session: booking, or its waitlist.
  const hasPickerSessions = Boolean(active?.programId) && sessions.some(s => s.state === "open" || (s.state === "full" && s.waitlistOpen))

  // Fallback CTA when there's no session to pick (nothing live yet, or no
  // upcoming demo). Never a checkout link the endpoint would reject.
  let fallback: HubCta
  if (active && status === "REGISTRATION_OPEN") {
    fallback = {
      href: CONTACT_SMS_HREF,
      label: `Text Us to Reserve — ${priceDisplay}`,
      eventName: "demo_registration_click",
      note: "Online registration for this demo is opening shortly. Text or call and we’ll help you register.",
    }
  } else if (!active && canJoinWaitlist) {
    fallback = { href: "#waitlist", label: "🔔 Join Next Demo Waitlist", eventName: "demo_waitlist_cta_clicked" }
  } else {
    fallback = { href: CONTACT_SMS_HREF, label: "Text Us to Join the Next Demo", eventName: "demo_waitlist_cta_clicked" }
  }
  // Journey card + sticky bar scroll to the reserve section's picker.
  const journeyCta: HubCta = hasPickerSessions
    ? { href: `#${RESERVE_SECTION_ID}`, label: "Reserve a Spot", eventName: "demo_registration_click" }
    : fallback

  const picker = (name: string, content: string) =>
    active?.programId && hasPickerSessions ? (
      <SessionReserve
        sessions={sessions.map(s => ({ label: s.label, offeringId: s.offeringId ?? "", state: s.state, waitlistOpen: s.waitlistOpen }))}
        programId={active.programId}
        priceDisplay={priceDisplay}
        attributionQuery={attributionQuery}
        name={name}
        content={content}
      />
    ) : (
      <CtaButton cta={fallback} offeringId={campaignOfferingId} content={content} />
    )

  const latestPast = past[0]
  const schemas = active
    ? eventSchemas(active, status, canRegister)
    : latestPast ? [highlightVideoSchema(latestPast)].filter(Boolean) : []

  const showWaitlistForm = !active && canJoinWaitlist

  return (
    <>
      {schemas.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(schemas) }} />}
      <DemoLandingAnalytics
        offeringId={campaignOfferingId}
        source={attribution.utm_source ?? attribution.ref ?? null}
        medium={attribution.utm_medium ?? null}
        campaign={attribution.utm_campaign ?? null}
        content={attribution.utm_content ?? null}
      />

      <main className={`min-h-screen overflow-x-hidden bg-white text-slate-900 ${canRegister ? "pb-20 sm:pb-0" : ""}`}>
        <DemoHero
          demo={active}
          status={status}
          actions={picker("hero-session", "hero")}
          note={hasPickerSessions ? undefined : fallback.note}
          hideSessionRow={hasPickerSessions}
          shareUrl={`${siteUrl}/demo`}
          heroCtaId={HERO_CTA_ID}
        />
        {latestPast && <PreviousDemoProof demo={latestPast} offeringId={campaignOfferingId} />}
        <WhatChildrenDo />
        <WhatChildrenLearn />
        <ProgramsSection offeringId={campaignOfferingId} />
        <DemoJourney demos={demos} activeId={active?.id ?? null} activeStatus={status} cta={journeyCta} offeringId={campaignOfferingId} />
        <PastDemoGallery past={past} />
        <ParentReviews reviews={demoReviews} />
        <ReserveSection demo={active} status={status} actions={picker("reserve-session", "reserve_section")} sectionId={RESERVE_SECTION_ID}>
          {showWaitlistForm ? (
            <div id="waitlist" className="scroll-mt-4">
              <DemoWaitlistForm programId={campaignProgramId} offeringId={campaignOfferingId} classesHref={ROBOTICS_BOOKING_URL} />
            </div>
          ) : active ? (
            <p className="text-center text-sm text-slate-600">
              <a href={CONTACT_SMS_HREF} className="font-bold text-[#0c6162] underline">Can’t Attend? Join the Next Demo Waitlist</a>
            </p>
          ) : (
            <ContactButtons />
          )}
        </ReserveSection>
        <DemoFaq ageRange={active?.ageRange ?? latestPast?.ageRange ?? "6–12"} />
      </main>

      {hasPickerSessions && canRegister && (
        <StickyReserveBar href={`#${RESERVE_SECTION_ID}`} label={`Reserve Demo — ${priceDisplay}`} offeringId={campaignOfferingId} watchIds={[HERO_CTA_ID, RESERVE_SECTION_ID]} />
      )}
      <Footer />
    </>
  )
}
