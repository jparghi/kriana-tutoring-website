'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { WorkshopTheme } from '../../data/demos'
import { DemoRegisterCta } from './DemoRegisterCta'

// Steps 1 and 2 of a themed, multi-date workshop (see WorkshopTheme in
// data/demos.ts): pick a date, then one of that date's theme cards — or, when
// the event has a single theme, that workshop is shown once and step 2 picks
// a time. Switching
// dates is instant and keeps ?date= in the URL so a shared link opens on the
// same day. Each card links to the existing register page with that
// session's own offeringId — the register page and its endpoint still make
// every real decision (open / full / waitlist / price).
export interface PickerDaySession {
  offeringId: string
  theme: string
  time: string // "9:30 AM–12:30 PM"
  part: 'Morning' | 'Afternoon'
  state: 'open' | 'full' | 'closed' | 'unavailable'
  waitlistOpen: boolean
  seatsLeft: number | null // only set when genuinely low (see publicSeatsLeft)
  subtotalCents: number
  taxCents: number
  priceCents: number
  regularSubtotalCents: number
  earlyBirdUntil: string | null // "Nov 10"
}

export interface PickerDay {
  date: string // YYYY-MM-DD
  weekday: string // "Friday"
  label: string // "Nov 20"
  sessions: PickerDaySession[]
}

export type PickerTheme = Pick<WorkshopTheme, 'name' | 'series' | 'focus' | 'palette' | 'blurb' | 'models' | 'image'>

// Literal class strings so Tailwind keeps them.
const PALETTES = {
  teal: {
    band: 'from-[#0E8C99] to-[#1D6FD8]',
    tint: 'bg-[#E7F6F7]',
    text: 'text-[#0E8C99]',
    cta: 'bg-[#0E8C99] hover:bg-[#0b7883] text-white shadow-[0_6px_16px_rgba(14,140,153,0.3)]',
    outline: 'border-[#0E8C99] text-[#0E8C99]',
  },
  purple: {
    band: 'from-[#6A3BCF] to-[#F2761B]',
    tint: 'bg-[#F3EEFF]',
    text: 'text-[#6A3BCF]',
    cta: 'bg-[#6A3BCF] hover:bg-[#5a2fb5] text-white shadow-[0_6px_16px_rgba(106,59,207,0.3)]',
    outline: 'border-[#6A3BCF] text-[#6A3BCF]',
  },
} as const

const dollars = (cents: number) => `$${cents % 100 === 0 ? cents / 100 : (cents / 100).toFixed(2)}`
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`

export function WorkshopPicker({
  days, themes, programId, attributionQuery, initialDate, contactHref, contactLabel,
}: {
  days: PickerDay[]
  themes: Record<string, PickerTheme>
  programId: string
  attributionQuery: string // already URL-encoded, allowlisted params only
  initialDate?: string
  contactHref: string
  contactLabel: string
}) {
  const [date, setDate] = useState(days.some(d => d.date === initialDate) ? initialDate! : days[0]?.date)
  const day = days.find(d => d.date === date) ?? days[0]

  function choose(next: string) {
    setDate(next)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('date', next)
      window.history.replaceState(null, '', url)
    } catch { /* URL sync is a convenience only */ }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const index = days.findIndex(d => d.date === date)
    const next = days[(index + step + days.length) % days.length]
    choose(next.date)
    document.getElementById(`workshop-date-${next.date}`)?.focus()
  }

  if (!day) return null
  const themeIds = Object.keys(themes)
  const single = themeIds.length === 1 ? themes[themeIds[0]] : null

  return (
    <div>
      {single && <WorkshopIntro theme={single} />}
      <StepHeading
        n={1}
        title="Pick your PA/PD Day"
        sub={days.length > 1 ? (single ? 'The same workshop runs on both days.' : 'Both days run the same two workshops.') : undefined}
      />
      <div role="radiogroup" aria-label="Workshop date" onKeyDown={onKeyDown} className="mt-4 grid max-w-xl grid-cols-2 gap-3">
        {days.map(d => {
          const checked = d.date === day.date
          const earlyBird = d.sessions.find(s => s.earlyBirdUntil)?.earlyBirdUntil
          return (
            <button
              key={d.date}
              id={`workshop-date-${d.date}`}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => choose(d.date)}
              className={`relative rounded-2xl border-2 bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5 ${
                checked ? 'border-[#0A2D5A] shadow-[0_0_0_3px_rgba(10,45,90,0.1)]' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span aria-hidden="true" className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 ${checked ? 'border-[#0A2D5A] bg-[#0A2D5A]' : 'border-slate-200'}`}>
                {checked && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5} className="h-3 w-3"><path d="M6 12.5l4 4 8-9" /></svg>}
              </span>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">{d.weekday}</span>
              <span className="block text-2xl font-black leading-tight text-[#0A2D5A]">{d.label}</span>
              {single && (
                <span className="block text-sm font-semibold text-slate-600">
                  {d.sessions.length > 1 ? d.sessions.map(s => s.part).join(' or ') : `${d.sessions[0]?.part ?? ''} only`}
                </span>
              )}
              <span className={`mt-1 block text-xs font-semibold ${earlyBird ? 'text-[#0c6162]' : 'text-slate-500'}`}>
                {earlyBird ? `Early bird until ${earlyBird}` : 'Regular price'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-10">
        {single ? (
          <StepHeading
            n={2}
            title="Pick a time"
            sub={day.sessions.length > 1
              ? 'Both times run the same workshop. Choose the one that suits your family.'
              : `One session on ${day.weekday.slice(0, 3)}, ${day.label}: the ${day.sessions[0]?.part.toLowerCase()}.`}
          />
        ) : (
          <StepHeading n={2} title="Choose a workshop" sub="Morning and afternoon are separate workshops. Book one or both." />
        )}
        <div key={day.date} className={`mt-4 grid gap-5 motion-safe:animate-[workshopSwap_.35s_ease] md:grid-cols-2 md:gap-6 ${single ? 'max-w-4xl' : ''}`}>
          {day.sessions.map(session => {
            if (single) {
              return (
                <TimeSlotCard
                  key={session.offeringId}
                  session={session}
                  theme={single}
                  day={day}
                  programId={programId}
                  attributionQuery={attributionQuery}
                  contactHref={contactHref}
                  contactLabel={contactLabel}
                />
              )
            }
            const theme = themes[session.theme]
            if (!theme) return null
            return (
              <WorkshopCard
                key={session.offeringId}
                session={session}
                theme={theme}
                day={day}
                programId={programId}
                attributionQuery={attributionQuery}
                contactHref={contactHref}
                contactLabel={contactLabel}
              />
            )
          })}
        </div>
      </div>
      <div className="mt-10">
        <StepHeading n={3} title="Register and pay" sub="A short form, then e-Transfer. Your spot is held for 48 hours and confirmed by email once the payment arrives." />
        <ul className="ml-[38px] mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600">
          {['All equipment provided', 'No card needed', single ? 'Pay by e-Transfer' : 'Each workshop is booked separately'].map(item => (
            <li key={item} className="flex items-center gap-1.5"><span aria-hidden="true" className="font-black text-[#0c6162]">✓</span>{item}</li>
          ))}
        </ul>
      </div>
      <style>{`@keyframes workshopSwap { from { opacity: .4; transform: translateY(6px); } }`}</style>
    </div>
  )
}

function StepHeading({ n, title, sub }: { n: number; title: string; sub?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A2D5A] text-sm font-black text-white">{n}</span>
        <h3 className="text-2xl font-black text-[#0A2D5A]">{title}</h3>
      </div>
      {sub && <p className="ml-[38px] mt-1 text-sm text-slate-600">{sub}</p>}
    </div>
  )
}

function WorkshopIntro({ theme }: { theme: PickerTheme }) {
  const palette = PALETTES[theme.palette]
  return (
    <article className="mb-10 grid overflow-hidden rounded-3xl border border-slate-200 bg-white md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className={`flex items-center bg-gradient-to-br ${palette.band} p-4 sm:p-5`}>
        <div className="mx-auto max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
          <Image src={theme.image.src} alt={theme.image.alt} width={theme.image.width} height={theme.image.height} sizes="(min-width: 768px) 448px, 100vw" className="block h-auto w-full" />
        </div>
      </div>
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <p className={`text-xs font-bold uppercase tracking-wider ${palette.text}`}>
          The workshop{theme.series ? ` · ${theme.series}` : ''}
        </p>
        <div>
          <h3 className="text-[28px] font-black leading-tight text-[#0A2D5A]">{theme.name}</h3>
          <p className="text-sm font-semibold text-slate-500">{theme.focus}</p>
        </div>
        <p className="text-[15px] leading-relaxed text-slate-800">{theme.blurb}</p>
        <p className="text-xs font-bold text-slate-500">
          {theme.models.length === 1 ? `The build: ${theme.models[0]}, one per child, built start to finish` : `Models: ${theme.models.join(' · ')}`}
        </p>
        <ul className="mt-auto grid grid-cols-2 gap-2 text-sm">
          {[['Duration', '3 hours'], ['Ages', '6–12']].map(([label, value]) => (
            <li key={label} className={`rounded-xl ${palette.tint} px-3 py-2`}>
              <span className={`block text-[11px] font-bold uppercase tracking-wider ${palette.text}`}>{label}</span>
              {value}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

interface CardProps {
  session: PickerDaySession
  theme: PickerTheme
  day: PickerDay
  programId: string
  attributionQuery: string
  contactHref: string
  contactLabel: string
}

// One time of a single-theme event: the workshop itself is in WorkshopIntro.
function TimeSlotCard(props: CardProps) {
  const { session, theme, day } = props
  const palette = PALETTES[theme.palette]
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(10,45,90,0.12)]">
      <div aria-hidden="true" className={`h-2 bg-gradient-to-r ${palette.band}`} />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${palette.text}`}>{session.part} · {day.weekday.slice(0, 3)}, {day.label}</p>
          <h4 className="mt-1 text-[28px] font-black leading-tight text-[#0A2D5A] tabular-nums">{session.time}</h4>
          <p className="text-sm text-slate-600">{theme.name} · 3 hours · Ages 6–12</p>
        </div>
        <SessionBooking {...props} />
      </div>
    </article>
  )
}

function WorkshopCard(props: CardProps) {
  const { session, theme, day } = props
  const palette = PALETTES[theme.palette]

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(10,45,90,0.12)]">
      <div className={`bg-gradient-to-br ${palette.band} px-5 pt-4 text-white`}>
        <div className="flex justify-between gap-2 text-xs font-bold uppercase tracking-wider opacity-95">
          <span>{session.part} · {day.weekday.slice(0, 3)}, {day.label}</span>
          {theme.series && <span>{theme.series}</span>}
        </div>
        <h4 className="mt-1.5 text-[27px] font-black leading-tight">{theme.name}</h4>
        <p className="text-sm font-semibold opacity-90">{theme.focus}</p>
        <div className="relative mt-3 aspect-[2/1] translate-y-5 overflow-hidden rounded-2xl bg-white shadow-[0_6px_16px_rgba(0,0,0,0.15)]">
          <Image
            src={theme.image.src}
            alt={theme.image.alt}
            fill
            sizes="(min-width: 768px) 520px, 100vw"
            className="object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-9">
        <p className="text-xs font-bold text-slate-500">Models: {theme.models.join(' · ')}</p>
        <p className="text-[15px] leading-relaxed text-slate-800">{theme.blurb}</p>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          {[['Time', session.time], ['Duration', '3 hours'], ['Ages', '6–12']].map(([label, value], index) => (
            <li key={label} className={`rounded-xl ${palette.tint} px-3 py-2 ${index === 0 ? 'col-span-2' : ''}`}>
              <span className={`block text-[11px] font-bold uppercase tracking-wider ${palette.text}`}>{label}</span>
              {value}
            </li>
          ))}
        </ul>
        <SessionBooking {...props} />
      </div>
    </article>
  )
}

// Price, availability badge and register/waitlist CTA for one session.
function SessionBooking({ session, theme, programId, attributionQuery, contactHref, contactLabel }: CardProps) {
  const palette = PALETTES[theme.palette]
  const bookable = session.state === 'open'
  const waitlist = session.state === 'full' && session.waitlistOpen
  const params = new URLSearchParams({ offeringId: session.offeringId, registrationType: 'demo' })
  const href = `/booking/${programId}/register?${params.toString()}${attributionQuery ? `&${attributionQuery}` : ''}`

  const badge = bookable
    ? session.seatsLeft
      ? { text: session.seatsLeft === 1 ? '1 spot left' : `${session.seatsLeft} spots left`, cls: 'bg-[#FFF1E0] text-[#A85A00]' }
      : { text: 'Spots available', cls: 'bg-emerald-50 text-emerald-700' }
    : session.state === 'full'
      ? { text: waitlist ? 'Full · waitlist open' : 'Full', cls: 'bg-slate-100 text-slate-600' }
      : { text: 'Registration closed', cls: 'bg-slate-100 text-slate-600' }

  return (
    <>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-dashed border-slate-200 pt-4">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${session.earlyBirdUntil ? 'text-[#0c6162]' : 'text-slate-500'}`}>
            {session.earlyBirdUntil ? `Early bird · until ${session.earlyBirdUntil}` : 'Workshop fee'}
          </p>
          <p className="text-3xl font-black leading-none text-[#0A2D5A] tabular-nums">
            {dollars(session.subtotalCents)}
            {session.taxCents > 0 && <span className="text-base font-semibold text-slate-500"> + HST</span>}
            {session.earlyBirdUntil && <s className="ml-1.5 text-base font-semibold text-slate-400">{dollars(session.regularSubtotalCents)}</s>}
          </p>
          <p className="mt-1 text-sm text-slate-500 tabular-nums">{money(session.priceCents)} total</p>
        </div>
        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${badge.cls}`}>{badge.text}</span>
      </div>

      {bookable || waitlist ? (
        <>
          <DemoRegisterCta
            href={href}
            offeringId={session.offeringId}
            label={waitlist ? 'Join the waitlist' : `Register for the ${session.part.toLowerCase()} session`}
            eventName={waitlist ? 'demo_waitlist_click' : 'demo_registration_click'}
            content={`workshop_card_${session.theme}`}
            className={`flex min-h-[52px] w-full items-center justify-center rounded-xl px-6 text-center text-base font-black transition-all active:scale-[0.98] ${
              waitlist ? `border-2 bg-white ${palette.outline}` : palette.cta
            }`}
          />
          <p className="-mt-2 text-center text-xs text-slate-500">
            {waitlist ? 'We’ll contact you if a spot opens.' : 'Your spot is held for 48 hours while you pay by e-Transfer.'}
          </p>
        </>
      ) : (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
          {session.state === 'full' ? 'This workshop is fully booked.' : 'Online registration isn’t open for this workshop.'}{' '}
          <a href={contactHref} className="font-bold text-[#0c6162] underline">{contactLabel}</a>
        </p>
      )}
    </>
  )
}
