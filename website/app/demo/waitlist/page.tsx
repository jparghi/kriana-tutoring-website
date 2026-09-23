import type { Metadata } from "next"
import Link from "next/link"
import { resolveDemoCampaignOffering } from "../../../lib/demo-campaign.server"
import { siteUrl } from "../../../lib/seo"
import { ROBOTICS_BOOKING_URL } from "../../../lib/site-links"
import { Footer } from "../../../components/footer"
import { DemoWaitlistForm } from "../DemoWaitlistForm"
import { ContactButtons } from "../sections"

// Live campaign/offering state decides whether the list is open — never
// render at build time (see app/demo/page.tsx).
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: { absolute: "Join Our Future Workshop List | Young Engineers Kanata & Stittsville" },
  description:
    "Hear first about upcoming Young Engineers demos, PD Day workshops and special STEM events in Kanata and Stittsville.",
  alternates: { canonical: `${siteUrl}/demo/waitlist` },
}

const COPY = {
  success: "We’ll let you know as soon as our next Young Engineers demo, PD Day or STEM event opens for registration.",
  consent: "I confirm this information is accurate and consent to Kriana contacting me about upcoming Young Engineers demos, workshops, STEM events and related programs.",
  submit: "Join Future Workshop List",
  footnote: "Free to join • No payment required. We’ll email you when our next event opens.",
}

// Same list as the evergreen /demo waitlist: joins queue against the
// env-configured campaign offering, and submit-demo-waitlist.js enforces its
// waitlistEnabled switch again at submission time.
export default async function FutureWorkshopListPage() {
  let open = false
  let programId = ""
  let offeringId = ""
  try {
    const campaign = await resolveDemoCampaignOffering()
    programId = campaign.programId ?? ""
    offeringId = campaign.offeringId ?? ""
    open = campaign.waitlistOpen === true && Boolean(programId && offeringId)
  } catch (error) {
    console.error("future workshop list unavailable", error)
  }

  return (
    <>
      <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
        <section className="px-5 pb-14 pt-6 sm:px-8" style={{ background: "linear-gradient(155deg, #FFF7E8 0%, #FFFFFF 50%, #F1F8F8 100%)" }}>
          <div className="mx-auto max-w-xl">
            <Link href="/demo" className="text-sm font-bold text-[#0c6162] hover:underline">← Back to the workshop</Link>
            <p className="mt-5 text-xs font-black uppercase tracking-wide text-[#0c6162]">Young Engineers Kanata</p>
            <h1 className="mt-2 text-[32px] font-black leading-[1.08] text-[#0A2D5A] sm:text-5xl">
              Join Our <span className="text-[#F2A100]">Future Workshop List</span>
            </h1>
            <p className="mt-4 text-base font-semibold leading-relaxed text-slate-700 sm:text-lg">
              Can&apos;t make this one? We&apos;ll let you know about upcoming Young Engineers demos, PD Days and special STEM events.
            </p>
            <div className="mt-7">
              {open ? (
                <DemoWaitlistForm programId={programId} offeringId={offeringId} classesHref={ROBOTICS_BOOKING_URL} copy={COPY} />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                  <p className="text-base font-bold text-slate-800">Call or text us and we&apos;ll add you to the list.</p>
                  <ContactButtons className="mt-4" />
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
