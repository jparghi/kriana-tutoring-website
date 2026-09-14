import type { Metadata } from "next"
import Image from "next/image"
import { cache } from "react"
import { resolveDemoCampaignOffering } from "../../lib/demo-campaign.server"
import { describeDemoEvent } from "../../lib/demo-event"
import { licensedRoboticsPrograms } from "../../lib/robotics-content"
import { ROBOTICS_BOOKING_URL, ROBOTICS_PATH } from "../../lib/site-links"
import { siteUrl, toJsonLd } from "../../lib/seo"
import { Footer } from "../../components/footer"
import { DemoLandingAnalytics } from "./DemoLandingAnalytics"
import { DemoHighlightVideo } from "./DemoHighlightVideo"
import { DemoRegisterCta } from "./DemoRegisterCta"
import { DemoWaitlistForm } from "./DemoWaitlistForm"
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
// Where "View Classes & Schedule" goes: the live robotics catalogue, which
// is the only place weekly schedules and the real enrollment flow exist.
const CLASSES_HREF = ROBOTICS_BOOKING_URL
const PROGRAM_INFO_HREF = `${ROBOTICS_PATH}#programs`
const WAITLIST_ANCHOR = "#waitlist"
const WAITLIST_CTA_LABEL = "🔔 Join the Next Demo Waitlist"
const HIGHLIGHT_VIDEO_PATH = "/videos/demo/young-engineers-demo-sept-2026-highlight.mp4"
const HIGHLIGHT_POSTER_PATH = "/images/demo/demo-sept-2026-highlight-poster.jpg"

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

  // /demo is a permanent, shared URL, so its metadata is evergreen by
  // default and only becomes event-specific while a demo is actually on
  // sale. Never advertise open seats unless the offering is bookable.
  const isOpen = campaign.pageState === "registration_open"
  const title = isOpen
    ? `$10 ${eventTitle} | Kriana Tutoring`
    : "Young Engineers STEM & Robotics Demo in Kanata | Kriana Tutoring"
  const description = isOpen
    ? `Reserve a hands-on Young Engineers demo for ages ${ageRange}${where}. Your $10 demo fee is credited when you enroll.`
    : "Discover hands-on Young Engineers STEM and robotics demos for kids in Kanata. See our latest demo in action and join the waitlist for the next event."

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

// Describes the real event footage rather than the event itself — the right
// schema for an evergreen page whose proof is a past demo.
function highlightVideoSchema(event: DemoEvent) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "Young Engineers Kanata Demo — highlights",
    description: "Highlights from our sold-out Young Engineers STEM and robotics demo class in Kanata.",
    thumbnailUrl: `${siteUrl}${HIGHLIGHT_POSTER_PATH}`,
    contentUrl: `${siteUrl}${HIGHLIGHT_VIDEO_PATH}`,
    ...(event.startIso ? { uploadDate: event.startIso } : {}),
    duration: "PT26S",
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

// ─── Evergreen page pieces ────────────────────────────────────────────────

const EXPERIENCE_HIGHLIGHTS = [
  { emoji: "🧱", title: "Hands-on building", body: "Every child builds a real working model with their own hands — no screens required." },
  { emoji: "⚙️", title: "Engineering concepts", body: "Gears, levers, pulleys and motion, explained by building them instead of reading about them." },
  { emoji: "🤖", title: "Robotics & mechanisms", body: "Models that move, spin and lift, so the engineering idea is something children can see working." },
  { emoji: "🧠", title: "Problem solving", body: "When a model doesn't work, children test, adjust and try again — the heart of engineering thinking." },
  { emoji: "🎉", title: "Learning while having fun", body: "A story-led session run by our instructors, where the learning feels like play." },
]

const DEMO_FAQS = [
  {
    q: "What happens at a Young Engineers demo?",
    a: "Children build a hands-on model with our instructors, see the engineering idea behind it in action, and get a taste of our Bricks Challenge, Algo Play and Smartivo programs. Parents are welcome to watch.",
  },
  {
    q: "What ages is the demo for?",
    a: "Our Kanata demos are designed for children ages 6–12. Smartivo, our early-coding program, runs for ages 4–7 — tell us your child's age on the waitlist form and we'll point you to the right fit.",
  },
  {
    q: "Does my child need previous experience?",
    a: "No. Demos are built to welcome first-time builders, and activities scale to each child's skill level.",
  },
  {
    q: "Do we need to bring anything?",
    a: "No. All building materials and equipment are provided on-site.",
  },
  {
    q: "Does joining the waitlist cost anything or commit me?",
    a: "No. The waitlist is free and commits you to nothing. It simply means you're notified first when registration for the next demo opens.",
  },
  {
    q: "When is the next demo?",
    a: "It isn't announced yet. Waitlist families are emailed as soon as a date, time and venue are confirmed — and demos have sold out, so an early heads-up matters.",
  },
  {
    q: "Can we start regular classes without waiting for a demo?",
    a: "Yes. Our regular Young Engineers programs in Kanata are enrolling now — see the classes and weekly schedule below.",
  },
]

function WaitlistCta({ offeringId, className = "", content }: { offeringId: string; className?: string; content?: string }) {
  return (
    <DemoRegisterCta
      href={WAITLIST_ANCHOR}
      offeringId={offeringId}
      label={WAITLIST_CTA_LABEL}
      eventName="demo_waitlist_cta_clicked"
      content={content}
      className={className || "inline-block w-full rounded-xl bg-[#F2A100] px-6 py-4 text-center text-base font-black text-white shadow-sm transition-transform active:scale-[0.98] sm:w-auto sm:px-10"}
    />
  )
}

function ClassesCta({ offeringId, content, className = "" }: { offeringId: string; content?: string; className?: string }) {
  return (
    <DemoRegisterCta
      href={CLASSES_HREF}
      offeringId={offeringId}
      label="View Classes & Schedule"
      eventName="demo_classes_cta_clicked"
      content={content}
      className={className || "inline-block w-full rounded-xl px-6 py-4 text-center text-base font-black text-white shadow-sm transition-transform active:scale-[0.98] sm:w-auto sm:px-10"}
      style={className ? undefined : { backgroundColor: "#0c6162" }}
    />
  )
}

// The permanent /demo page: a sold-out demo as social proof, the waitlist for
// the next one as the primary CTA, and regular classes as the secondary path.
// Serves the 'completed', 'waitlist' and 'sold_out' lifecycle states — only
// the hero copy differs between them, and only 'sold_out' still talks about a
// specific dated event.
function EvergreenDemoPage({
  pageState, event, offeringId, programId, canJoinWaitlist,
}: {
  pageState: "completed" | "waitlist" | "sold_out"
  event: DemoEvent
  offeringId: string
  programId: string
  canJoinWaitlist: boolean
}) {
  const isSoldOutUpcoming = pageState === "sold_out"
  const heading = isSoldOutUpcoming
    ? `Our ${event.shortDateLabel ? `${event.shortDateLabel} ` : ""}Young Engineers Demo Is Sold Out`
    : "Missed Our Last Young Engineers Demo?"
  const programs = licensedRoboticsPrograms.filter(program => !program.comingSoon)

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      {/* ─── 1. Hero: sold-out proof + the next-demo waitlist CTA ─── */}
      <section className="px-5 pb-9 pt-6 sm:px-8" style={{ background: "linear-gradient(155deg, #FFF7E8 0%, #FFFFFF 45%, #FFF1F4 100%)" }}>
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="inline-block rounded-full bg-[#ED174B]/10 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-[#ED174B]">
              Sold Out 🎉
            </span>
            <h1 className="mt-3 text-[28px] font-black leading-[1.12] text-[#0A2D5A] sm:text-4xl">
              {heading}
            </h1>

            {isSoldOutUpcoming ? (
              <>
                <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-600">
                  Every spot for this demo is taken. Join the waitlist and we&apos;ll contact you if a place opens up —
                  and you&apos;ll be first to hear when our next Young Engineers Kanata Demo is announced.
                </p>
                <div className="mt-5 flex justify-center">
                  <EventDetails event={event} />
                </div>
                <p className="mx-auto mt-4 max-w-md text-sm text-slate-600">
                  <span className="font-bold text-slate-800">Already registered?</span> Please refer to your registration
                  email for your booking and payment details.
                </p>
              </>
            ) : (
              <div className="mx-auto mt-3 max-w-md space-y-2 text-[15px] leading-relaxed text-slate-600 sm:text-base">
                <p>
                  Our <span className="font-bold text-slate-800">September 12 Kanata Demo was SOLD OUT!</span>
                </p>
                <p>We had an amazing time building, experimenting and learning with our young engineers.</p>
                <p className="font-bold text-slate-800">Want your child to experience it?</p>
                <p>
                  Join our waitlist and we&apos;ll notify you as soon as the next Young Engineers Kanata Demo is announced.
                </p>
              </div>
            )}

            {canJoinWaitlist ? (
              <div className="mt-6">
                <WaitlistCta offeringId={offeringId} content="hero" />
                <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-slate-500">
                  No payment required. We&apos;ll notify you when registration for our next demo opens.
                </p>
              </div>
            ) : (
              <div className="mt-7">
                <ClassesCta offeringId={offeringId} content="hero_no_waitlist" />
                <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-slate-500">
                  Our next demo isn&apos;t open yet — call or text {CONTACT_PHONE_DISPLAY} and we&apos;ll let you know first.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 2. Real footage from the September 12 demo ─── */}
      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-black text-[#0A2D5A] sm:text-3xl">See Young Engineers in Action 🚀</h2>
          <p className="mx-auto mt-2 max-w-md text-base text-slate-600">
            Take a look at our sold-out September 12 Kanata Demo!
          </p>
          <div className="mt-7">
            <DemoHighlightVideo offeringId={offeringId || null} />
          </div>
        </div>
      </section>

      {/* ─── 3 + 4. Conversion right after the video, then the form itself ─── */}
      <section id="waitlist" className="scroll-mt-4 bg-slate-50 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-xl">
          <div className="text-center">
            <h2 className="text-2xl font-black text-[#0A2D5A] sm:text-3xl">Want Your Child at the Next One?</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-600">
              Join the waitlist and be among the first families notified when our next Young Engineers Kanata Demo opens.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm font-bold text-[#ED174B]">
              Our last demo sold out — waitlist families get notified first.
            </p>
          </div>

          <div className="mt-6">
            {canJoinWaitlist ? (
              <DemoWaitlistForm programId={programId} offeringId={offeringId} classesHref={CLASSES_HREF} />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-base font-bold text-slate-800">Our waitlist isn&apos;t open at the moment.</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                  Call or text us and we&apos;ll add you to the list for the next Young Engineers Kanata Demo — or start
                  regular classes now.
                </p>
                <ContactButtons className="mt-5" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 5. What the experience actually is (social proof, not stock copy) ─── */}
      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-black text-[#0A2D5A] sm:text-3xl">
            A Sold-Out STEM Experience in Kanata
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-base leading-relaxed text-slate-600">
            Here&apos;s what the children in the video spent their session doing.
          </p>
          {/* Real September 12 photos slot in here as a gallery once they're
              selected and consent-checked — the grid below is independent of
              it, so adding one is additive, not a rewrite. */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {EXPERIENCE_HIGHLIGHTS.map(item => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-2xl" aria-hidden="true">{item.emoji}</p>
                <h3 className="mt-2 text-base font-black text-slate-800">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. The programs a demo introduces (evergreen content) ─── */}
      <section className="bg-slate-50 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-black text-[#0A2D5A] sm:text-3xl">The Young Engineers Programs</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-base leading-relaxed text-slate-600">
            A demo gives children a taste of all three. Each one is a licensed Young Engineers program running weekly in
            Kanata.
          </p>
          <div className="mt-8 space-y-4">
            {programs.map(program => (
              <div key={program.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <Image
                    src={program.logo}
                    alt=""
                    width={56}
                    height={56}
                    className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
                  />
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-slate-800">{program.title}</h3>
                    <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Ages {program.ageRange.replace("-", "–")} · {program.durationMin} min classes
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{program.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            <a href={PROGRAM_INFO_HREF} className="font-bold text-[#0c6162] hover:underline">
              Read more about each program →
            </a>
          </p>
        </div>
      </section>

      {/* ─── 7. Regular enrollment: secondary, but easy to find ─── */}
      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-[#0A2D5A]">Ready to Get Started?</h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-600">
            You don&apos;t have to wait for the next demo. Our regular Young Engineers programs in Kanata are now
            enrolling.
          </p>
          <div className="mt-6">
            <ClassesCta offeringId={offeringId} content="classes_section" />
          </div>
          <ContactButtons className="mt-4" />
        </div>
      </section>

      {/* ─── 8. FAQ ─── */}
      <section className="bg-slate-50 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-black text-[#0A2D5A] sm:text-3xl">Frequently Asked Questions</h2>
          <div className="mt-7 space-y-3">
            {DEMO_FAQS.map(faq => (
              <details key={faq.q} className="group rounded-2xl border border-slate-200 bg-white p-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-bold text-slate-800 marker:content-none">
                  {faq.q}
                  <span aria-hidden="true" className="text-slate-400 transition-all duration-200 group-open:rotate-45 group-open:text-[#ED174B]">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. Final waitlist CTA ─── */}
      {canJoinWaitlist && (
        <section className="px-5 py-14 sm:px-8" style={{ background: "linear-gradient(155deg, #FFF7E8 0%, #FFFFFF 55%, #FFF1F4 100%)" }}>
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-black text-[#0A2D5A] sm:text-3xl">Don&apos;t Miss the Next One</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-600">
              Waitlist families are notified first when registration opens. It&apos;s free, and takes under a minute.
            </p>
            <div className="mt-6">
              <WaitlistCta offeringId={offeringId} content="footer" />
            </div>
            <div className="mt-6 flex justify-center">
              <ShareInviteButton url={`${siteUrl}/demo`} title="Young Engineers Demo — Kanata" />
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const campaign = await getCampaign()
  const event = describeDemoEvent(campaign.offering)

  // 'open' guarantees these at runtime; the fallbacks here only satisfy
  // TypeScript, since demo-campaign.server.js is a plain .js module without
  // a discriminated-union return type.
  const offeringId = campaign.offeringId ?? ""
  const programId = campaign.programId ?? ""

  const attribution = pickAttributionParams(searchParams)
  const analytics = (
    <DemoLandingAnalytics
      offeringId={offeringId}
      source={attribution.utm_source ?? attribution.ref ?? null}
      medium={attribution.utm_medium ?? null}
      campaign={attribution.utm_campaign ?? null}
      content={attribution.utm_content ?? null}
    />
  )

  // ─── Registration open: the $10 booking flyer, unchanged ───
  if (campaign.pageState === "registration_open") {
    // The same register link serves both booking and the waitlist — the
    // register page decides which form to show from the offering's live
    // state, and each form's endpoint independently enforces it server-side.
    const ctaParams = new URLSearchParams({ offeringId, registrationType: "demo", ...attribution })
    const ctaHref = `/booking/${programId}/register?${ctaParams.toString()}`
    const eventSchema = eventSchemaFor(event, "InStock")
    const eventTitle = event.title || DEFAULT_EVENT_TITLE

    return (
      <>
        {eventSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(eventSchema) }} />}
        {analytics}

        <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
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

  // ─── Everything else: the permanent sold-out recap + next-demo waitlist ───
  // A join needs a real offering to queue against, and that offering's own
  // waitlistEnabled switch — exactly what submit-demo-waitlist.js enforces.
  const canJoinWaitlist = campaign.waitlistOpen === true && Boolean(offeringId && programId)
  const pageState = campaign.pageState as "completed" | "waitlist" | "sold_out"

  // A dated Event is only truthful while the event is still ahead of us; the
  // completed/waitlist states describe the footage instead.
  const schema = pageState === "sold_out" ? eventSchemaFor(event, "SoldOut") : highlightVideoSchema(event)

  return (
    <>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }} />}
      {analytics}
      <EvergreenDemoPage
        pageState={pageState}
        event={event}
        offeringId={offeringId}
        programId={programId}
        canJoinWaitlist={canJoinWaitlist}
      />
      <Footer />
    </>
  )
}
