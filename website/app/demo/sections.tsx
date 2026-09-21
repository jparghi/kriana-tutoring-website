import Image from "next/image"
import Link from "next/link"
import {
  ArrowPathIcon,
  BeakerIcon,
  BoltIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  PuzzlePieceIcon,
  Squares2X2Icon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline"
import type { DemoEvent, DemoMedia, DemoStatus } from "../../data/demos"
import type { DemoReview } from "../../data/demo-reviews"
import { eventTerms } from "../../lib/demo-event-copy"
import { demoMonth, formatDemoDate } from "../../lib/demo-hub"
import { licensedRoboticsPrograms } from "../../lib/robotics-content"
import { GALLERY_PATH, ROBOTICS_PATH } from "../../lib/site-links"
import { DemoHighlightVideo } from "./DemoHighlightVideo"
import { DemoRegisterCta } from "./DemoRegisterCta"
import { ShareInviteButton } from "./ShareInviteButton"
import type { FunnelEvent } from "../../lib/analytics"

export const CONTACT_PHONE_DISPLAY = "613-400-6921"
export const CONTACT_PHONE_HREF = "tel:+16134006921"
export const CONTACT_SMS_HREF = "sms:+16134006921"

// The single call-to-action every section renders, resolved once in page.tsx
// from the hub state so no section has to know about lifecycle rules.
export interface HubCta {
  href: string
  label: string
  eventName: FunnelEvent
  note?: string
}

const ctaClass =
  "inline-block w-full rounded-xl bg-[#F2A100] px-6 py-4 text-center text-base font-black text-white shadow-sm transition-transform active:scale-[0.98] sm:w-auto sm:px-10"

export function CtaButton({ cta, offeringId, content }: { cta: HubCta; offeringId: string; content: string }) {
  return (
    <DemoRegisterCta
      href={cta.href}
      offeringId={offeringId}
      label={cta.label}
      eventName={cta.eventName}
      content={content}
      className={ctaClass}
    />
  )
}

export function ContactButtons({ className = "" }: { className?: string }) {
  const base =
    "flex-1 rounded-xl border border-[#0c6162] px-5 py-3 text-center text-sm font-black text-[#0c6162] transition-colors hover:bg-[#0c6162]/5"
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <a href={CONTACT_PHONE_HREF} className={base}>Call {CONTACT_PHONE_DISPLAY}</a>
      <a href={CONTACT_SMS_HREF} className={base}>Text {CONTACT_PHONE_DISPLAY}</a>
    </div>
  )
}

function SectionHeading({ title, sub, id }: { title: string; sub?: string; id?: string }) {
  return (
    <div className="text-center">
      <h2 id={id} className="text-2xl font-black text-[#0A2D5A] sm:text-3xl">{title}</h2>
      {sub && <p className="mx-auto mt-2 max-w-lg text-base leading-relaxed text-slate-600">{sub}</p>}
    </div>
  )
}

const STATUS_BADGE: Record<DemoStatus, { label: string; className: string }> = {
  REGISTRATION_OPEN: { label: "Registration open", className: "bg-emerald-100 text-emerald-800" },
  SOLD_OUT: { label: "Sold out", className: "bg-[#ED174B]/10 text-[#ED174B]" },
  WAITLIST: { label: "Waitlist", className: "bg-sky-100 text-sky-800" },
  COMPLETED: { label: "Completed", className: "bg-slate-100 text-slate-700" },
}

function StatusBadge({ status, soldOut }: { status: DemoStatus; soldOut?: boolean }) {
  const badge = STATUS_BADGE[status]
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${badge.className}`}>
      {badge.label}{status === "COMPLETED" && soldOut ? " · Sold out" : ""}
    </span>
  )
}

function DetailRow({ icon, children }: { icon: "calendar" | "clock" | "pin" | "tag"; children: React.ReactNode }) {
  const path = {
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
    tag: <><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z" /><circle cx="7.5" cy="7.5" r="1.2" /></>,
    pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>,
  }[icon]
  return (
    <li className="flex items-start gap-3 text-[15px] font-bold text-slate-800">
      <svg viewBox="0 0 24 24" fill="none" stroke="#F2A100" strokeWidth={2.5} className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true">{path}</svg>
      <span>{children}</span>
    </li>
  )
}

function SessionPills({ demo }: { demo: DemoEvent }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {demo.sessions.map(session => (
        <li key={session.label} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-[#0A2D5A]">
          {session.name ? <><span className="font-black">{session.name}</span> <span className="font-semibold text-slate-600">{session.label}</span></> : session.label}
        </li>
      ))}
    </ul>
  )
}

// ─── 1. Hero ─────────────────────────────────────────────────────────────

export function DemoHero({
  demo, status, actions, note, hideSessionRow, shareUrl, heroCtaId,
}: {
  demo: DemoEvent | null
  status: DemoStatus
  actions: React.ReactNode // session picker + register button, or a fallback CTA
  note?: string
  hideSessionRow?: boolean // the picker already lists the sessions
  shareUrl: string
  heroCtaId: string
}) {
  const showEvent = demo !== null
  return (
    <section className="px-5 pb-10 pt-6 sm:px-8" style={{ background: "linear-gradient(155deg, #FFF7E8 0%, #FFFFFF 50%, #F1F8F8 100%)" }}>
      <div className="mx-auto max-w-3xl">
        <div>
          <p className="text-xs font-bold text-slate-500">Young Engineers Workshops &amp; Demo Events</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-wide text-[#0c6162]">{showEvent ? "Next event" : "Young Engineers Kanata"}</p>
            {showEvent && <StatusBadge status={status} />}
          </div>
          <h1 className="mt-3 text-[32px] font-black leading-[1.08] text-[#0A2D5A] sm:text-5xl">
            {showEvent ? demo.title : <>Young Engineers <span className="text-[#F2A100]">Workshops &amp; Demo Events</span></>}
          </h1>
          {showEvent && demo.hook ? (
            <>
              <p className="mt-4 text-xl font-black leading-snug text-[#0A2D5A] sm:text-2xl">
                {demo.hook[0]}
                {demo.hook[1] && <span className="block text-[#F2A100]">{demo.hook[1]}</span>}
              </p>
              {demo.summary && <p className="mt-3 text-base font-semibold leading-relaxed text-slate-700 sm:text-lg">{demo.summary}</p>}
              <p className="mt-1 text-sm font-semibold text-slate-500">Build • Create • Test • Explore</p>
            </>
          ) : (
            <>
              <p className="mt-3 text-lg font-semibold text-slate-700">Hands-on STEM, Engineering &amp; Coding for Kids</p>
              <p className="mt-1 text-base font-semibold text-slate-500">Build • Create • Code • Explore</p>
            </>
          )}

          {showEvent ? (
            <ul className="mt-6 space-y-3">
              <DetailRow icon="calendar">{formatDemoDate(demo.date, "full")}</DetailRow>
              {demo.priceLabel && <DetailRow icon="tag">{demo.priceLabel} — ${demo.price}</DetailRow>}
              <DetailRow icon="pin">
                {demo.address.split(",")[0]}
                <span className="block text-sm font-semibold text-slate-500">{demo.address.split(",").slice(1).join(",").trim()}</span>
              </DetailRow>
              {!hideSessionRow && (
                <li className="flex items-start gap-3 text-[15px] font-bold text-slate-800">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#F2A100" strokeWidth={2.5} className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                  <span>
                    {demo.sessions.length > 1 ? "Two sessions" : "Session"}
                    <span className="mt-1.5 block"><SessionPills demo={demo} /></span>
                  </span>
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600">
              Our next Young Engineers demo hasn&apos;t been announced yet. Join the waitlist and you&apos;ll hear first.
            </p>
          )}

          <div id={heroCtaId} className="mt-7">
            {showEvent && status === "SOLD_OUT" && (
              <p className="mb-3 inline-block rounded-full bg-[#ED174B]/10 px-4 py-1.5 text-sm font-black uppercase tracking-wide text-[#ED174B]">Sold out</p>
            )}
            <div>{actions}</div>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              {showEvent ? `Ages ${demo.ageRange} • Hands-on STEM experience` : "Free to join • No payment required"}
            </p>
            {note && <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{note}</p>}
            <p className="mt-3 text-sm text-slate-600">
              Call/Text <a href={CONTACT_PHONE_HREF} className="font-bold text-[#0c6162] hover:underline">{CONTACT_PHONE_DISPLAY}</a>
            </p>
          </div>
          <div className="mt-4"><ShareInviteButton url={shareUrl} title={demo?.title ?? "Young Engineers Workshops & Demo Events"} /></div>
          {showEvent && demo.hook && (
            <p className="mt-5 text-sm font-bold italic text-[#0c6162]">&ldquo;They don&apos;t just build — they learn WHY it works.&rdquo;</p>
          )}
          <p className="mt-5 text-xs font-semibold text-slate-400">Young Engineers Kanata · Operated by Kriana Tutoring</p>
        </div>

      </div>
    </section>
  )
}

// ─── 2. Proof from the previous demo ─────────────────────────────────────

function PhotoGrid({ images, max }: { images: DemoMedia[]; max: number }) {
  if (!images.length) return null
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.slice(0, max).map((image, index) => (
        <li key={image.src} className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 ${index === 0 && images.length > 2 ? "col-span-2 sm:col-span-1" : ""}`}>
          <Image src={image.src} alt={image.alt} fill loading="lazy" sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />
        </li>
      ))}
    </ul>
  )
}

export function PreviousDemoProof({ demo, offeringId, next }: { demo: DemoEvent; offeringId: string; next: DemoEvent | null }) {
  const month = demoMonth(demo.date)
  const terms = eventTerms(demo.eventType)
  const nextTerms = next ? eventTerms(next.eventType) : null
  return (
    <section className="px-5 py-12 sm:px-8" aria-labelledby="proof-heading">
      <div className="mx-auto max-w-3xl text-center">
        <SectionHeading
          id="proof-heading"
          title="See What Kids Have Built at Our Previous Events"
          sub={`Our ${month} Young Engineers ${terms.short}${demo.soldOut ? " SOLD OUT 🎉" : ""}`}
        />
        {demo.highlightVideo && (
          <div className="mt-7">
            <DemoHighlightVideo
              offeringId={offeringId || null}
              src={demo.highlightVideo.src}
              poster={demo.highlightVideo.poster}
              label={`Play the ${formatDemoDate(demo.date)} demo highlight video`}
            />
          </div>
        )}
        {(demo.galleryImages?.length ?? 0) > 0 && <div className="mt-6 text-left"><PhotoGrid images={demo.galleryImages!} max={5} /></div>}
        <p className="mt-6 text-sm font-black uppercase tracking-wide text-[#0c6162]">Real kids • Real engineering • Real learning</p>
        <Link href={`#gallery-${demo.id}`} className="mt-5 inline-block rounded-xl border-2 border-[#0A2D5A] px-6 py-3 text-sm font-black text-[#0A2D5A] transition-colors hover:bg-[#0A2D5A]/5">
          See {month} {terms.short} Highlights
        </Link>
        {next && nextTerms && (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#F2A100]/40 bg-[#FFF7E8] p-6">
            <h3 className="text-xl font-black text-[#0A2D5A]">
              Join Us for Our {formatDemoDate(next.date)} {next.title.replace(/^Young Engineers /, "")}
            </h3>
            <DemoRegisterCta
              href="#reserve"
              offeringId={offeringId}
              label={nextTerms.reserveShort}
              eventName="demo_registration_click"
              content="proof_transition"
              className="mt-4 inline-block w-full rounded-xl bg-[#F2A100] px-6 py-4 text-center text-base font-black text-white shadow-sm transition-transform active:scale-[0.98] sm:w-auto sm:px-10"
            />
          </div>
        )}
      </div>
    </section>
  )
}

// ─── 3. What will my child do ────────────────────────────────────────────

const CHILD_STEPS = [
  { title: "Build", body: "Create a working engineering model.", Icon: WrenchScrewdriverIcon },
  { title: "Test", body: "Experiment with gears, structures, forces and movement.", Icon: BeakerIcon },
  { title: "Learn", body: "Understand why the model works.", Icon: LightBulbIcon },
  { title: "Improve", body: "Modify the design and solve challenges.", Icon: ArrowPathIcon },
]

export function WhatChildrenDo() {
  return (
    <section className="bg-slate-50 px-5 py-12 sm:px-8" aria-labelledby="child-heading">
      <div className="mx-auto max-w-4xl">
        <SectionHeading id="child-heading" title="What Will My Child Do?" />
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHILD_STEPS.map(({ title, body, Icon }, index) => (
            <li key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0c6162]/10 text-[#0c6162]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <span className="text-xs font-black text-slate-400">STEP {index + 1}</span>
              </div>
              <h3 className="mt-3 text-lg font-black text-[#0A2D5A]">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-9 max-w-xl text-center text-xl font-black leading-snug text-[#0A2D5A] sm:text-2xl">
          &ldquo;They don&apos;t just build — they learn <span className="text-[#ED174B]">WHY</span> it works.&rdquo;
        </p>
      </div>
    </section>
  )
}

// ─── 4. What children learn ──────────────────────────────────────────────

const CONCEPTS = [
  { title: "Mechanics", body: "How machines transfer and change motion.", Icon: Cog6ToothIcon },
  { title: "Gears & forces", body: "Speed, strength and balance, seen in a real model.", Icon: Squares2X2Icon },
  { title: "Structures", body: "Why some designs stand strong and others wobble.", Icon: WrenchScrewdriverIcon },
  { title: "Motors", body: "Adding power and making a build move on its own.", Icon: BoltIcon },
  { title: "Problem-solving", body: "Testing what went wrong and trying again.", Icon: PuzzlePieceIcon },
  { title: "Creative thinking", body: "Finding their own way to design and improve.", Icon: LightBulbIcon },
]

export function WhatChildrenLearn() {
  return (
    <section className="px-5 py-12 sm:px-8" aria-labelledby="learn-heading">
      <div className="mx-auto max-w-4xl">
        <SectionHeading id="learn-heading" title="More Than Brick Building" sub="Every model is a way in to a real engineering idea." />
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONCEPTS.map(({ title, body, Icon }) => (
            <li key={title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <Icon className="mt-0.5 h-6 w-6 shrink-0 text-[#F2A100]" aria-hidden="true" />
              <div>
                <h3 className="text-base font-black text-slate-800">{title}</h3>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            </li>
          ))}
        </ul>
        <ol className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm font-black text-[#0A2D5A] sm:text-base" aria-label="Build, test, learn, improve">
          {["Build", "Test", "Learn", "Improve"].map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="text-[#F2A100]">→</span>}
              <span className="rounded-full bg-[#0A2D5A] px-4 py-1.5 text-white">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ─── 5. Programs ─────────────────────────────────────────────────────────

const PROGRAM_BLURBS: Record<string, string> = {
  smartivo: "For younger builders.",
  "bricks-challenge": "Hands-on engineering, mechanics and creative problem-solving.",
  "algo-play": "Coding and engineering challenges.",
}

export function ProgramsSection({ offeringId }: { offeringId: string }) {
  const programs = licensedRoboticsPrograms.filter(program => program.id in PROGRAM_BLURBS)
  return (
    <section className="bg-slate-50 px-5 py-12 sm:px-8" aria-labelledby="programs-heading">
      <div className="mx-auto max-w-4xl">
        <SectionHeading id="programs-heading" title="Explore Young Engineers Programs" sub="Where kids can keep building after the event." />
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {programs.map(program => (
            <li key={program.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Image src={program.logo} alt="" width={56} height={56} className="h-12 w-12 object-contain" />
              <h3 className="mt-3 text-lg font-black text-slate-800">{program.title}</h3>
              <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-400">Ages {program.ageRange.replace("-", "–")}</p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{PROGRAM_BLURBS[program.id]}</p>
              <DemoRegisterCta
                href={ROBOTICS_PATH}
                offeringId={offeringId}
                label="Learn more →"
                eventName="demo_classes_cta_clicked"
                content={`program_${program.id}`}
                className="mt-4 inline-block text-sm font-black text-[#0c6162] hover:underline"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ─── 6. Demo journey (timeline, data-driven) ─────────────────────────────

export function DemoJourney({
  demos, activeId, activeStatus, cta, offeringId,
}: {
  demos: DemoEvent[]
  activeId: string | null
  activeStatus: DemoStatus
  cta: HubCta
  offeringId: string
}) {
  const ordered = [...demos].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <section className="px-5 py-12 sm:px-8" aria-labelledby="journey-heading">
      <div className="mx-auto max-w-3xl">
        <SectionHeading id="journey-heading" title="Young Engineers Workshops & Demo Events" sub="Every event builds on the last." />
        <ol className="mt-8 space-y-5 border-l-2 border-slate-200 pl-5 sm:pl-7">
          {ordered.map(demo => {
            const isActive = demo.id === activeId
            const status: DemoStatus = isActive ? activeStatus : "COMPLETED"
            return (
              <li key={demo.id} className="relative">
                <span aria-hidden="true" className={`absolute -left-[1.85rem] top-5 h-3.5 w-3.5 rounded-full border-2 border-white sm:-left-[2.3rem] ${isActive ? "bg-[#F2A100]" : "bg-[#0c6162]"}`} />
                <div className={`rounded-2xl border bg-white p-5 shadow-sm ${isActive ? "border-[#F2A100]" : "border-slate-200"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-[#0A2D5A]">{formatDemoDate(demo.date, "full")}</p>
                    <StatusBadge status={status} soldOut={demo.soldOut} />
                  </div>
                  <p className="mt-2 text-base font-black text-slate-800">{demo.title}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-500">{demo.location}{demo.program ? ` · ${demo.program}` : ""}{status !== "COMPLETED" ? ` · $${demo.price}` : ""}</p>
                  {status === "COMPLETED" ? (
                    <>
                      {demo.build && <p className="mt-3 text-sm text-slate-700"><span className="font-bold">Build:</span> {demo.build}</p>}
                      {demo.learningTopics.length > 0 && <p className="mt-1 text-sm text-slate-700"><span className="font-bold">Learning:</span> {demo.learningTopics.join(" · ")}</p>}
                      <Link href={`#gallery-${demo.id}`} className="mt-3 inline-block text-sm font-black text-[#0c6162] hover:underline">View Gallery →</Link>
                    </>
                  ) : (
                    <>
                      <div className="mt-3"><SessionPills demo={demo} /></div>
                      <div className="mt-4">
                        <DemoRegisterCta
                          href={cta.href}
                          offeringId={offeringId}
                          label={status === "REGISTRATION_OPEN" ? eventTerms(demo.eventType).reserveShort : cta.label}
                          eventName={cta.eventName}
                          content="journey"
                          className="inline-block rounded-xl bg-[#F2A100] px-5 py-3 text-sm font-black text-white"
                        />
                      </div>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

// ─── 7. Past demo gallery (data-driven) ──────────────────────────────────

export function PastDemoGallery({ past }: { past: DemoEvent[] }) {
  if (!past.length) return null
  return (
    <section className="bg-slate-50 px-5 py-12 sm:px-8" aria-labelledby="gallery-heading">
      <div className="mx-auto max-w-4xl">
        <SectionHeading id="gallery-heading" title="Past Events" />
        <div className="mt-8 space-y-8">
          {past.map(demo => {
            const image = demo.highlightVideo
              ? { src: demo.highlightVideo.poster, alt: `Highlights from the ${formatDemoDate(demo.date)} Young Engineers demo`, width: 540, height: 960 }
              : demo.heroImage
            return (
              <article key={demo.id} id={`gallery-${demo.id}`} className="scroll-mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-0 md:grid-cols-[minmax(0,260px)_1fr]">
                  {image && (
                    <div className="relative aspect-[4/3] bg-slate-100 md:aspect-auto md:min-h-[320px]">
                      <Image src={image.src} alt={image.alt} fill loading="lazy" sizes="(min-width: 768px) 260px, 100vw" className="object-cover object-[50%_40%]" />
                    </div>
                  )}
                  <div className="p-5 sm:p-7">
                    <StatusBadge status="COMPLETED" soldOut={demo.soldOut} />
                    <h3 className="mt-3 text-xl font-black text-[#0A2D5A]">{formatDemoDate(demo.date, "long")} {eventTerms(demo.eventType).short} · {demo.location}</h3>
                    {demo.build && (
                      <p className="mt-3 text-sm text-slate-500">The Challenge
                        <span className="block text-lg font-black text-slate-800">{demo.build}</span>
                      </p>
                    )}
                    {demo.learningTopics.length > 0 && (
                      <>
                        <p className="mt-4 text-sm font-bold text-slate-700">Children explored:</p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {demo.learningTopics.map(topic => (
                            <li key={topic} className="rounded-full bg-[#0c6162]/10 px-3 py-1 text-sm font-semibold text-[#0c6162]">{topic}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {(demo.galleryImages?.length ?? 0) > 0 && <div className="mt-5"><PhotoGrid images={demo.galleryImages!} max={8} /></div>}
                    <Link href={GALLERY_PATH} className="mt-6 inline-block rounded-xl bg-[#0A2D5A] px-6 py-3 text-sm font-black text-white">View {eventTerms(demo.eventType).short} Highlights</Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── 8. Reviews (hidden until configured) ────────────────────────────────

export function ParentReviews({ reviews }: { reviews: DemoReview[] }) {
  if (!reviews.length) return null
  const shown = reviews.slice(0, 3)
  return (
    <section className="px-5 py-12 sm:px-8" aria-labelledby="reviews-heading">
      <div className="mx-auto max-w-4xl">
        <SectionHeading id="reviews-heading" title="What Parents Are Saying" />
        <ul className={`mx-auto mt-8 grid gap-4 ${shown.length === 1 ? "max-w-xl" : shown.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {shown.map(review => (
            <li key={review.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <blockquote className="text-[15px] leading-relaxed text-slate-700">&ldquo;{review.quote}&rdquo;</blockquote>
              <p className="mt-3 text-sm font-black text-slate-800">{review.name}</p>
              <p className="text-xs text-slate-500">{review.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ─── 9. Second registration CTA ──────────────────────────────────────────

export function ReserveSection({
  demo, status, actions, sectionId, children,
}: {
  demo: DemoEvent | null
  status: DemoStatus
  actions: React.ReactNode // session picker + register button, or a fallback CTA
  sectionId: string
  children?: React.ReactNode // secondary path (waitlist form / call-text), supplied by the page
}) {
  return (
    <section id={sectionId} className="scroll-mt-4 px-5 py-14 sm:px-8" style={{ background: "linear-gradient(155deg, #FFF7E8 0%, #FFFFFF 55%, #F1F8F8 100%)" }}>
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-2xl font-black text-[#0A2D5A] sm:text-3xl">
          {demo ? (eventTerms(demo.eventType).kind === "workshop" ? "Give Your Child a Great PD Day" : "Ready to Let Your Child Experience It?") : "Want Your Child at the Next One?"}
        </h2>
        {demo ? (
          <p className="mx-auto mt-3 font-black text-[#0A2D5A]">{demo.title}<span className="block text-sm font-semibold text-slate-600">{formatDemoDate(demo.date, "long")}, {demo.date.slice(0, 4)} · {demo.location}</span></p>
        ) : (
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-600">
            Join the waitlist and be among the first families notified when the next Young Engineers demo opens.
          </p>
        )}
        {status === "SOLD_OUT" && <p className="mt-2 text-sm font-black uppercase text-[#ED174B]">Sold out</p>}
        {actions && <div className="mt-6 text-left">{actions}</div>}
        {actions && (
          <p className="mt-4 text-sm text-slate-600">
            Call/Text <a href={CONTACT_PHONE_HREF} className="font-bold text-[#0c6162] hover:underline">{CONTACT_PHONE_DISPLAY}</a>
          </p>
        )}
        {children && <div className="mt-6 text-left">{children}</div>}
      </div>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────

export function DemoFaq({ ageRange, eventType }: { ageRange: string; eventType?: string }) {
  const terms = eventTerms(eventType)
  const workshop = terms.kind === "workshop"
  const faqs = [
    {
      q: `What happens at a Young Engineers ${terms.faqTitle}?`,
      a: workshop
        ? "Your child takes part in a 90-minute hands-on session with our instructors: building a working engineering model, testing it, and finding out why it works. Everything is provided."
        : "Children build a hands-on model with our instructors and see the engineering idea behind it in action. Parents are welcome to watch.",
    },
    { q: `What ages is the ${terms.faqTitle} for?`, a: `This ${terms.faqTitle} is designed for children ages ${ageRange}. Tell us your child's age and we'll point you to the right program.` },
    { q: "Does my child need previous experience?", a: "No. First-time builders are welcome, and activities scale to each child's skill level." },
    { q: "Do we need to bring anything?", a: "No. All building materials and equipment are provided on-site." },
    { q: "Does joining the event waitlist cost anything?", a: "No. It's free, commits you to nothing, and simply means you're notified first when the next Young Engineers event opens." },
  ]
  return (
    <section className="bg-slate-50 px-5 py-12 sm:px-8" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-2xl">
        <SectionHeading id="faq-heading" title="Frequently Asked Questions" />
        <div className="mt-7 space-y-3">
          {faqs.map(faq => (
            <details key={faq.q} className="group rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-bold text-slate-800 marker:content-none">
                {faq.q}
                <span aria-hidden="true" className="text-slate-400 transition-all duration-200 group-open:rotate-45 group-open:text-[#ED174B]">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
