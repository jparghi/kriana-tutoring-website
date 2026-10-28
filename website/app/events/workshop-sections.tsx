import Image from "next/image"
import type { DemoEvent, WorkshopTheme } from "../../data/demos"
import { eventDateLabel } from "../../lib/demo-hub"
import { DemoRegisterCta } from "./DemoRegisterCta"
import { ShareInviteButton } from "./ShareInviteButton"
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "./sections"

// Sections for a themed, multi-date workshop (an event with `themes` in
// data/demos.ts). The single-event layout in sections.tsx is untouched and
// still renders every other event.

const PALETTE_TEXT: Record<WorkshopTheme["palette"], string> = {
  teal: "text-[#0E8C99]",
  purple: "text-[#6A3BCF]",
}

function Fact({ icon, children }: { icon: "calendar" | "clock" | "pin"; children: React.ReactNode }) {
  const path = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  }[icon]
  return (
    <li className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold">
      <svg viewBox="0 0 24 24" fill="none" stroke="#F2A100" strokeWidth={2.2} className="h-4 w-4 shrink-0" aria-hidden="true">{path}</svg>
      {children}
    </li>
  )
}

export function WorkshopHero({
  demo, heroCtaId, reserveHref, offeringId, priceNote, shareUrl, statusNote,
}: {
  demo: DemoEvent
  heroCtaId: string
  reserveHref: string
  offeringId: string
  priceNote: string // "Early bird $34 + HST ($38.42) per workshop"
  shareUrl: string
  statusNote?: string // shown instead of the price when nothing is bookable
}) {
  // "9:30 AM–12:30 PM or 1:30 PM–4:30 PM" — each distinct session time once.
  const times = [...new Set(demo.sessions.map(s => s.label.split(" · ").pop()))].join(" or ")
  const image = demo.heroImage
  const themeList = Object.values(demo.themes ?? {})
  const singleTheme = themeList.length === 1 ? themeList[0] : null
  return (
    <section className="relative overflow-hidden bg-[#0A2D5A] text-white">
      {/* engineering-block studs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.13] [mask-image:linear-gradient(105deg,transparent_30%,#000_85%)]"
        style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #fff 0 5px, transparent 6px)", backgroundSize: "28px 28px" }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-12 pt-9 sm:px-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center md:gap-12 md:py-16">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9fd3d8]">
            {singleTheme ? `PA/PD Day Workshop · ${singleTheme.name}` : "PA/PD Day Workshops"} · Ages {demo.ageRange}
          </p>
          <h1 className="mt-3 text-[46px] font-black leading-[0.98] sm:text-[68px]">
            {demo.hook?.[0] ?? demo.title}
            {demo.hook?.[1] && <span className="block text-[#F2A100]">{demo.hook[1]}</span>}
          </h1>
          {demo.summary && <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#d8e2ee]">{demo.summary}</p>}
          <ul className="mt-5 flex flex-wrap gap-2">
            <Fact icon="calendar">{eventDateLabel(demo, "short")}</Fact>
            {times && <Fact icon="clock">{times}</Fact>}
            <Fact icon="pin">{demo.address.split(",")[0]}, {demo.location}</Fact>
          </ul>
          <div id={heroCtaId} className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <DemoRegisterCta
              href={reserveHref}
              offeringId={offeringId}
              label={singleTheme ? "Choose Your Time" : "Choose Your Workshop"}
              content="hero"
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#F2A100] px-7 text-lg font-black text-[#1d1300] shadow-[0_6px_18px_rgba(242,161,0,0.35)] transition-all hover:-translate-y-px hover:shadow-[0_10px_26px_rgba(242,161,0,0.5)] active:scale-[0.98]"
            />
            <p className="text-sm text-[#b8c6d8]">{statusNote ?? priceNote}</p>
          </div>
          <p className="mt-4 text-sm text-[#b8c6d8]">
            Questions? Call/Text <a href={CONTACT_PHONE_HREF} className="font-bold text-white hover:underline">{CONTACT_PHONE_DISPLAY}</a>
          </p>
          <div className="mt-4"><ShareInviteButton url={shareUrl} title={demo.title} /></div>
        </div>
        {image && (
          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <Image src={image.src} alt={image.alt} width={image.width} height={image.height} priority sizes="(min-width: 768px) 520px, 100vw" className="block h-auto w-full" />
            </div>
            <div className="absolute -bottom-4 left-4 flex items-center gap-3 rounded-xl bg-white px-4 py-2 shadow-[0_8px_22px_rgba(0,0,0,0.18)]">
              <Image src="/images/email-signature/young-engineers-wordmark-high-resolution.png" alt="Young Engineers" width={1350} height={470} className="h-7 w-auto" />
              <span aria-hidden="true" className="h-6 w-px bg-slate-200" />
              <Image src="/images/kriana-tutoring-logo-horizontal-4.png" alt="Kriana Tutoring" width={1505} height={452} className="h-7 w-auto" />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

const COMPARE_ROWS: { key: keyof WorkshopTheme["compare"]; label: string }[] = [
  { key: "goodFor", label: "Great for kids who" },
  { key: "builds", label: "They build" },
  { key: "bigIdea", label: "Big idea" },
  { key: "teamwork", label: "Teamwork" },
]

export function WorkshopCompare({ demo }: { demo: DemoEvent }) {
  const entries = Object.entries(demo.themes ?? {})
  if (entries.length < 2) return null
  // One time per theme, from its first session.
  const timeOf = (id: string) => demo.sessions.find(s => s.theme === id)?.label.split(" · ").pop() ?? ""
  return (
    <section className="bg-slate-50 px-5 py-12 sm:px-8" aria-labelledby="compare-heading">
      <div className="mx-auto max-w-5xl">
        <h2 id="compare-heading" className="text-2xl font-black text-[#0A2D5A] sm:text-3xl">Which workshop fits your child?</h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
          Both are 3 hours of hands-on building for ages {demo.ageRange}. Pick the one that matches what makes your child light up, or book both.
        </p>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[540px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="w-[24%] p-3.5"><span className="sr-only">Compare</span></th>
                {entries.map(([id, theme]) => <th key={id} scope="col" className={`p-3.5 text-base font-black ${PALETTE_TEXT[theme.palette]}`}>{theme.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(row => (
                <tr key={row.key} className="border-b border-slate-200">
                  <th scope="row" className="p-3.5 align-top text-xs font-bold uppercase tracking-wide text-slate-500">{row.label}</th>
                  {entries.map(([id, theme]) => <td key={id} className="p-3.5 align-top text-slate-700">{theme.compare[row.key]}</td>)}
                </tr>
              ))}
              <tr>
                <th scope="row" className="p-3.5 align-top text-xs font-bold uppercase tracking-wide text-slate-500">When</th>
                {entries.map(([id]) => <td key={id} className="p-3.5 align-top font-semibold text-slate-700">{timeOf(id)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export function WorkshopInfo({ details }: { details: { label: string; text: string }[] }) {
  if (!details.length) return null
  return (
    <section className="px-5 py-12 sm:px-8" aria-labelledby="details-heading">
      <div className="mx-auto max-w-5xl">
        <h2 id="details-heading" className="text-2xl font-black text-[#0A2D5A] sm:text-3xl">Workshop details</h2>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {details.map(item => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
              <dt className="text-xs font-bold uppercase tracking-wider text-[#0c6162]">{item.label}</dt>
              <dd className="mt-1 text-[15px] text-slate-800">{item.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
