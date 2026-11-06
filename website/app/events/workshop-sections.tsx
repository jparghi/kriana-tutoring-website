import Image from "next/image"
import type { DemoEvent, WorkshopTheme } from "../../data/demos"
import { ShareInviteButton } from "./ShareInviteButton"
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "./sections"

// Sections for a themed, multi-date workshop (an event with `themes` in
// data/demos.ts). The single-event layout in sections.tsx is untouched and
// still renders every other event.

const PALETTE_TEXT: Record<WorkshopTheme["palette"], string> = {
  teal: "text-[#0E8C99]",
  purple: "text-[#6A3BCF]",
}

// Literal class strings so Tailwind keeps them.
const PALETTE_INTRO: Record<WorkshopTheme["palette"], { band: string; tint: string }> = {
  teal: { band: "from-[#0E8C99] to-[#1D6FD8]", tint: "bg-[#E7F6F7]" },
  purple: { band: "from-[#6A3BCF] to-[#F2761B]", tint: "bg-[#F3EEFF]" },
}

/** The workshop itself (single-theme events): build photo, blurb, key facts. */
export function WorkshopIntro({ theme, ageRange }: { theme: WorkshopTheme; ageRange: string }) {
  const palette = PALETTE_INTRO[theme.palette]
  const text = PALETTE_TEXT[theme.palette]
  return (
    <section className="px-5 py-12 sm:px-8" aria-labelledby="workshop-intro-heading">
      <article className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className={`flex items-center bg-gradient-to-br ${palette.band} p-4 sm:p-5`}>
          <div className="mx-auto max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
            <Image src={theme.image.src} alt={theme.image.alt} width={theme.image.width} height={theme.image.height} sizes="(min-width: 768px) 448px, 100vw" className="block h-auto w-full" />
          </div>
        </div>
        <div className="flex flex-col gap-3 p-5 sm:p-6">
          <p className={`text-xs font-bold uppercase tracking-wider ${text}`}>
            The workshop{theme.series ? ` · ${theme.series}` : ""}
          </p>
          <div>
            <h2 id="workshop-intro-heading" className="text-[28px] font-black leading-tight text-[#0A2D5A]">{theme.name}</h2>
            <p className="text-sm font-semibold text-slate-500">{theme.focus}</p>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-800">{theme.blurb}</p>
          <p className="text-xs font-bold text-slate-500">
            {theme.models.length === 1 ? `The build: ${theme.models[0]}, one per child, built start to finish` : `Models: ${theme.models.join(" · ")}`}
          </p>
          <ul className="mt-auto grid grid-cols-2 gap-2 text-sm">
            {[["Duration", "3 hours"], ["Ages", ageRange]].map(([label, value]) => (
              <li key={label} className={`rounded-xl ${palette.tint} px-3 py-2`}>
                <span className={`block text-[11px] font-bold uppercase tracking-wider ${text}`}>{label}</span>
                {value}
              </li>
            ))}
          </ul>
        </div>
      </article>
    </section>
  )
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

// The hero is the booking area: workshop name, price and the session picker
// card (QuickBook) up top, so a parent from a Facebook link can book without
// scrolling. The rest of the pitch sits under the card on phones and beside
// it on desktop.
export function WorkshopHero({
  demo, booking, priceLine, shareUrl,
}: {
  demo: DemoEvent
  booking: React.ReactNode // the QuickBook card
  priceLine: string // "$38.42 per child, HST included"
  shareUrl: string
}) {
  const themeList = Object.values(demo.themes ?? {})
  const singleTheme = themeList.length === 1 ? themeList[0] : null
  return (
    <section className="relative bg-[#0A2D5A] text-white">
      {/* engineering-block studs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.13] [mask-image:linear-gradient(105deg,transparent_30%,#000_85%)]"
        style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #fff 0 5px, transparent 6px)", backgroundSize: "28px 28px" }}
      />
      {/* Phones: header, card, details. Desktop: header + details left, card right. */}
      <div className="relative mx-auto grid max-w-6xl gap-x-12 gap-y-6 px-4 pb-10 pt-6 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:py-14">
        <div className="md:col-start-1 md:row-start-1">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#9fd3d8]">
            PA/PD Day Workshop · Ages {demo.ageRange} · {demo.location}
          </p>
          <h1 className="mt-1.5 text-[34px] font-black leading-[1.02] sm:text-5xl">{singleTheme?.name ?? demo.title}</h1>
          {priceLine && <p className="mt-2 text-base font-semibold text-[#F2A100]">{priceLine}</p>}
        </div>
        <div className="md:col-start-2 md:row-span-2 md:row-start-1 md:self-start">{booking}</div>
        <div className="md:col-start-1 md:row-start-2">
          {demo.hook && (
            <p className="text-2xl font-black leading-tight">
              {demo.hook[0]} <span className="text-[#F2A100]">{demo.hook[1]}</span>
            </p>
          )}
          {demo.summary && <p className="mt-3 max-w-xl text-base leading-relaxed text-[#d8e2ee] sm:text-lg">{demo.summary}</p>}
          {/* No combined date/time line: "Nov 20 & 23 · 9:30–12:30 or
              1:30–4:30" implied a Nov 23 afternoon. The session picker lists
              the real sessions. */}
          <ul className="mt-5 flex flex-wrap gap-2">
            <Fact icon="pin">{demo.address.split(",")[0]}, {demo.location}</Fact>
          </ul>
          <p className="mt-4 text-sm text-[#b8c6d8]">
            Questions? Call/Text <a href={CONTACT_PHONE_HREF} className="font-bold text-white hover:underline">{CONTACT_PHONE_DISPLAY}</a>
          </p>
          <div className="mt-4"><ShareInviteButton url={shareUrl} title={demo.title} /></div>
        </div>
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
