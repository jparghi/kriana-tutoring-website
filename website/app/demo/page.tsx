import type { Metadata } from "next"
import { cache } from "react"
import { resolveDemoCampaignOffering } from "../../lib/demo-campaign.server"
import { describeDemoEvent } from "../../lib/demo-event"
import { siteUrl, toJsonLd } from "../../lib/seo"
import { Footer } from "../../components/footer"
import { DemoLandingAnalytics } from "./DemoLandingAnalytics"
import { DemoRegisterCta } from "./DemoRegisterCta"
import { ShareInviteButton } from "./ShareInviteButton"

// Always render per-request, never at build time — this page depends on
// live campaign/offering state (capacity, publish status, registration
// window) that must never go stale, and must never attempt a Firestore call
// during the Netlify build itself (which fails there; Firestore access is
// only expected to work in the deployed request-serving environment).
export const dynamic = 'force-dynamic'

const DEFAULT_EVENT_TITLE = "Young Engineers Demo Class"
const CONTACT_PHONE_DISPLAY = "613-400-6921"
const CONTACT_PHONE_HREF = "tel:+16134006921"
const CONTACT_SMS_HREF = "sms:+16134006921"
const REGULAR_PROGRAMS_HREF = "/robotics#programs"

// generateMetadata and the page both need the campaign — cache() dedupes the
// Firestore read to once per request.
const getCampaign = cache(() => resolveDemoCampaignOffering())

type DemoEvent = ReturnType<typeof describeDemoEvent>

export async function generateMetadata(): Promise<Metadata> {
  const campaign = await getCampaign()
  const event = describeDemoEvent(campaign.offering)
  const eventTitle = event.title || DEFAULT_EVENT_TITLE
  const where = event.venueName ? ` at ${event.venueName}` : ""
  const ageRange = typeof campaign.program?.ageRange === "string" ? campaign.program.ageRange.replace("-", "–") : "6–12"

  // Never advertise open seats unless the offering is actually bookable.
  const isOpen = campaign.status === "open"
  const title = isOpen
    ? `$10 ${eventTitle} | Kriana Tutoring`
    : `${eventTitle} | Kriana Tutoring`
  const description = isOpen
    ? `Reserve a hands-on Young Engineers demo for ages ${ageRange}${where}. Your $10 demo fee is credited when you enroll.`
    : campaign.status === "full"
      ? `Our ${event.shortDateLabel ? `${event.shortDateLabel} ` : ""}Young Engineers demo is fully booked.${campaign.waitlistOpen ? " Join the waitlist to hear first about our next demo." : ""} Explore our regular Young Engineers programs for ages ${ageRange}.`
      : `Explore Young Engineers programs for ages ${ageRange} with Kriana Tutoring.`

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
      images: [{ url: `${siteUrl}/images/demo/demo-share.png`, alt: eventTitle }],
    },
  }
}

function eventSchemaFor(event: DemoEvent, availability: "InStock" | "SoldOut") {
  if (!event.startIso) return null
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title || DEFAULT_EVENT_TITLE,
    startDate: event.startIso,
    ...(event.endIso ? { endDate: event.endIso } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: event.venueName || event.location,
      ...(event.address ? { address: event.address } : {}),
    },
    offers: { "@type": "Offer", price: "10", priceCurrency: "CAD", availability: `https://schema.org/${availability}`, url: `${siteUrl}/demo` },
    organizer: { "@type": "Organization", name: "Kriana Tutoring", url: siteUrl },
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

function ContactButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <a href={CONTACT_PHONE_HREF} className="flex-1 rounded-xl border border-[#0c6162] px-5 py-3 text-center text-sm font-black text-[#0c6162] transition-colors hover:bg-[#0c6162]/5">
        Call {CONTACT_PHONE_DISPLAY}
      </a>
      <a href={CONTACT_SMS_HREF} className="flex-1 rounded-xl border border-[#0c6162] px-5 py-3 text-center text-sm font-black text-[#0c6162] transition-colors hover:bg-[#0c6162]/5">
        Text {CONTACT_PHONE_DISPLAY}
      </a>
    </div>
  )
}

function EventDetails({ event }: { event: DemoEvent }) {
  if (!event.dateLabel && !event.venueName) return null
  return (
    <div className="inline-block rounded-2xl bg-white/80 px-5 py-4 text-left shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
      {event.dateLabel && (
        <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="#F2A100" strokeWidth={2.5} className="h-4 w-4 shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          {event.dateLabel}
        </p>
      )}
      {event.timeLabel && (
        <p className="mt-1.5 flex items-center gap-2 text-sm font-bold text-slate-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="#F2A100" strokeWidth={2.5} className="h-4 w-4 shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
          {event.timeLabel}
        </p>
      )}
      {event.venueName && (
        <p className="mt-1.5 flex items-center gap-2 text-sm font-bold text-slate-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="#F2A100" strokeWidth={2.5} className="h-4 w-4 shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
          {event.venueName}
        </p>
      )}
    </div>
  )
}

function UnavailableState({ heading, body }: { heading: string; body: string }) {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex items-center justify-center px-6">
      <div className="max-w-md text-center py-24">
        <h1 className="text-2xl font-black text-slate-800 mb-3">{heading}</h1>
        <p className="text-slate-500 leading-relaxed mb-6">{body}</p>
        <ContactButtons />
      </div>
    </main>
  )
}

// Shown when the demo is full OR staff paused public booking
// (publicRegistrationPaused) — the public page never offers booking here,
// only the waitlist (when the offering's waitlistEnabled switch is on),
// regular programs, and call/text.
function FullyBookedState({ event, waitlistHref, offeringId }: { event: DemoEvent; waitlistHref: string | null; offeringId: string }) {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="px-6 pb-16 pt-10 sm:px-10" style={{ background: "linear-gradient(155deg, #FFF7E8 0%, #FFFFFF 45%, #FFF1F4 100%)" }}>
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700">
            {event.title || DEFAULT_EVENT_TITLE}
          </span>
          <h1 className="mt-4 text-3xl font-black leading-tight text-[#0A2D5A] sm:text-4xl">
            Our {event.shortDateLabel ? `${event.shortDateLabel} ` : ""}demo is fully booked!
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-600">
            Thank you for your interest. We&apos;ve reached capacity, and registration for this demo is closed.
          </p>

          <div className="mt-6">
            <EventDetails event={event} />
          </div>

          <p className="mx-auto mt-4 max-w-md text-sm text-slate-600">
            <span className="font-bold text-slate-800">Already registered?</span> Please refer to your registration email for your booking and payment details.
          </p>

          {waitlistHref && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm sm:p-6">
              <h2 className="text-lg font-black text-slate-800">Join the Waitlist</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                It&apos;s free and no payment is due. If a spot opens up, we&apos;ll contact you — and families on the waitlist will be the first to hear about our next demo.
              </p>
              <DemoRegisterCta
                href={waitlistHref}
                offeringId={offeringId}
                label="Join the Waitlist"
                eventName="demo_waitlist_click"
                className="mt-4 inline-block w-full rounded-xl bg-[#F2A100] px-6 py-4 text-center text-base font-black text-white shadow-sm transition-all active:scale-[0.98]"
              />
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm sm:p-6">
            <h2 className="text-base font-black text-slate-800">Keep exploring</h2>
            <p className="mt-1 text-sm text-slate-600">See our regular Young Engineers programs, or call or text us about future demos.</p>
            <a
              href={REGULAR_PROGRAMS_HREF}
              className="mt-4 block w-full rounded-xl px-6 py-3 text-center text-sm font-black text-white shadow-sm transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#0c6162" }}
            >
              Explore Regular Programs
            </a>
            <ContactButtons className="mt-3" />
          </div>
        </div>
      </section>
    </main>
  )
}

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const campaign = await getCampaign()

  if (campaign.status === "closed") {
    return <UnavailableState heading="Registration has closed" body={`Registration for this demo has closed. Call or text ${CONTACT_PHONE_DISPLAY} to ask about other options.`} />
  }
  if (campaign.status !== "open" && campaign.status !== "full") {
    return <UnavailableState heading="This demo isn't available right now" body={`Call or text ${CONTACT_PHONE_DISPLAY} and we'll help you find another option.`} />
  }

  // 'open' and 'full' both guarantee these at runtime; the fallbacks here
  // only satisfy TypeScript, since demo-campaign.server.js is a plain .js
  // module without a discriminated-union return type.
  const offeringId = campaign.offeringId ?? ""
  const programId = campaign.programId ?? ""
  const event = describeDemoEvent(campaign.offering)

  // The same register link serves both booking and the waitlist — the
  // register page decides which form to show from the offering's live state,
  // and each form's endpoint independently enforces it server-side.
  const attribution = pickAttributionParams(searchParams)
  const ctaParams = new URLSearchParams({ offeringId, registrationType: "demo", ...attribution })
  const ctaHref = `/booking/${programId}/register?${ctaParams.toString()}`

  const analytics = (
    <DemoLandingAnalytics
      offeringId={offeringId}
      source={attribution.utm_source ?? attribution.ref ?? null}
      medium={attribution.utm_medium ?? null}
      campaign={attribution.utm_campaign ?? null}
      content={attribution.utm_content ?? null}
    />
  )

  if (campaign.status === "full") {
    const soldOutSchema = eventSchemaFor(event, "SoldOut")
    return (
      <>
        {soldOutSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(soldOutSchema) }} />}
        {analytics}
        <FullyBookedState event={event} waitlistHref={campaign.waitlistOpen ? ctaHref : null} offeringId={offeringId} />
        <Footer />
      </>
    )
  }

  const eventSchema = eventSchemaFor(event, "InStock")
  const eventTitle = event.title || DEFAULT_EVENT_TITLE

  return (
    <>
      {eventSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(eventSchema) }} />}
      {analytics}

      <main className="min-h-screen bg-white text-slate-900">
        {/* ─── Hero: video left, info + CTA right — this is the "flyer" the link shares as ─── */}
        <section className="relative overflow-hidden px-6 pb-10 pt-8 sm:px-10" style={{ background: "linear-gradient(155deg, #FFF7E8 0%, #FFFFFF 45%, #FFF1F4 100%)" }}>
          <div className="mx-auto max-w-4xl">
            <div className="mb-5 flex justify-end">
              <ShareInviteButton url={`${siteUrl}/demo`} title={eventTitle} />
            </div>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
              {/* Vertical video, framed like a flyer/story */}
              <div className="mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:mx-0">
                <div className="relative overflow-hidden rounded-[2rem] border-4 border-white shadow-[0_20px_50px_rgba(242,161,0,0.25)]">
                  <video
                    className="aspect-[9/16] w-full bg-slate-900 object-cover"
                    src="/videos/demo/young-engineers-demo-ad-v3.mp4"
                    poster="/images/demo/demo-video-poster.jpg"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                  />
                </div>
                {/* Immediate CTA for visitors already primed by the ad video — the full CTA card below reinforces it */}
                <DemoRegisterCta
                  href={ctaHref}
                  offeringId={offeringId}
                  className="mt-4 block w-full rounded-xl bg-[#F2A100] px-5 py-3 text-center text-sm font-black text-white shadow-sm transition-all active:scale-[0.98] lg:hidden"
                />
              </div>

              {/* Headline, essentials, and the CTA — right under the info, not buried below */}
              <div className="text-center lg:text-left">
                <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700">
                  $10 Demo Class
                </span>
                <h1 className="mt-4 text-4xl font-black leading-[1.05] sm:text-5xl" style={{ color: "#F2A100" }}>
                  Young Engineers
                  {event.area && <span className="block text-[#0A2D5A]">{event.area}</span>}
                </h1>
                <p className="mt-3 text-lg font-semibold text-slate-700">Build · Create · Code · Explore</p>
                <p className="mt-2 max-w-md text-sm text-slate-600 lg:mx-0 mx-auto">
                  A hands-on engineering and coding experience for children ages 6–12.
                </p>

                <div className="mt-5">
                  <EventDetails event={event} />
                </div>

                {/* Reserve spot — directly below the essentials, not at the page bottom */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
                  <h2 className="text-lg font-black text-slate-800">Reserve Your Child&apos;s Spot for $10</h2>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    Attend the demo and enroll in an eligible Young Engineers program afterward, and your $10 demo fee will be credited toward registration.
                  </p>
                  <DemoRegisterCta
                    href={ctaHref}
                    offeringId={offeringId}
                    className="mt-4 inline-block w-full rounded-xl bg-[#F2A100] px-6 py-4 text-base font-black text-white shadow-sm transition-all active:scale-[0.98]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Details, below the fold ─── */}
        <section className="px-6 sm:px-10 mt-12">
          <div className="mx-auto max-w-lg">
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Build a hands-on Bricks Challenge model.</li>
              <li>• Experience coding and robotics.</li>
              <li>• Discover Bricks Challenge, AlgoPlay and Smartivo.</li>
              <li>• Designed for children ages 6–12.</li>
              <li>• Limited capacity.</li>
              <li>
                • Call or text <a href={CONTACT_PHONE_HREF} className="text-[#0c6162] font-semibold hover:underline">{CONTACT_PHONE_DISPLAY}</a>.
              </li>
            </ul>
          </div>
        </section>

        {/* Trust and clarity */}
        <section className="px-6 sm:px-10 mt-8 mb-16">
          <div className="mx-auto max-w-lg rounded-2xl bg-slate-50 border border-slate-100 p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Good to know</p>
            <ul className="space-y-2 text-xs text-slate-500 leading-relaxed">
              <li>The fee is $10 CAD.</li>
              <li>Submitting the form temporarily holds a seat.</li>
              <li>The seat is confirmed after Kriana receives and verifies payment.</li>
              <li>The $10 credit becomes available after the child attends.</li>
              <li>No-shows do not receive an enrollment credit.</li>
              <li>The event has limited capacity.</li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
