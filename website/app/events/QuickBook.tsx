'use client'

import { Suspense, createContext, useContext, useEffect, useRef, useState } from 'react'
import { getOffering, isDemoOfferingPubliclyFull, isOfferingRequestWindowOpen } from '../../lib/booking'
import { trackEvent } from '../../lib/analytics'
import { DemoRegisterForm, readLastEventParent, type LastEventParent } from '../../components/booking/DemoRegisterForm'

// Booking for a themed workshop (data/demos.ts `themes`): one radio per
// session in the hero (QuickBookSessions), and picking one opens the
// registration form in its own section right under the hero (QuickBookForm),
// with no page change. Built for parents arriving from a Facebook post
// on a phone. The form posts to the same endpoints as the register page, and
// those still make every real decision (open / full / waitlist / price).
//
// ?session=nov20-am preselects a session (for session-specific ads);
// ?offering=<id>&another=1 is the confirmation page's "Register another
// child" link, which also fills in the parent details saved on this browser.

export interface PickerDaySession {
  offeringId: string
  theme: string
  time: string // "9:30 AM–12:30 PM"
  part: 'Morning' | 'Afternoon'
  state: 'open' | 'full' | 'closed' | 'unavailable'
  waitlistOpen: boolean
  seatsLeft: number | null
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

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`

/** "nov20-am", the ?session= value for one session. */
export function sessionKey(date: string, part: PickerDaySession['part']) {
  return `${MONTHS[Number(date.slice(5, 7)) - 1]}${Number(date.slice(8, 10))}-${part === 'Morning' ? 'am' : 'pm'}`
}

interface Row extends PickerDaySession {
  key: string
  dayLabel: string // "Fri Nov 20"
}

type Loaded = Record<string, any | null> // offeringId → offering (null: couldn't load)

// Shared between the session buttons (in the hero) and the form section
// (right under the hero), which are separate parts of the page.
interface QuickBookState {
  id: string
  formId: string
  rows: Row[]
  multiTheme: boolean
  themeNames: Record<string, string>
  selected: Row | null
  selectable: (row: Row) => boolean
  choose: (row: Row) => void
  change: () => void
  radiosRef: React.RefObject<HTMLFieldSetElement>
  formRef: React.RefObject<HTMLElement>
  offering: any | null | undefined // undefined: still loading
  prefill: LastEventParent | null
  programId: string
  programTitle: string
  contactHref: string
}

const QuickBookContext = createContext<QuickBookState | null>(null)

function useQuickBook() {
  const state = useContext(QuickBookContext)
  if (!state) throw new Error('QuickBook parts must be inside <QuickBookProvider>')
  return state
}

export function QuickBookProvider({
  id, formId, days, themeNames, programId, programTitle, initialSession, initialOffering, another, contactHref, children,
}: {
  id: string // the session buttons' anchor (#book)
  formId: string // the form section's anchor
  days: PickerDay[]
  themeNames: Record<string, string> // shown per button only when there are several
  programId: string
  programTitle: string
  initialSession?: string
  initialOffering?: string
  another?: boolean
  contactHref: string
  children: React.ReactNode
}) {
  const rows: Row[] = days.flatMap(day => day.sessions.map(session => ({
    ...session,
    key: sessionKey(day.date, session.part),
    dayLabel: `${day.weekday.slice(0, 3)} ${day.label}`,
  })))
  const selectable = (row: Row) => row.state === 'open' || (row.state === 'full' && row.waitlistOpen)
  const initial = rows.find(row => selectable(row) && (row.key === initialSession || row.offeringId === initialOffering))

  const [selectedId, setSelectedId] = useState<string | null>(initial?.offeringId ?? null)
  const [offerings, setOfferings] = useState<Loaded>({})
  const [prefill, setPrefill] = useState<LastEventParent | null>(null)
  // A preselected session (?session=) stays on the hero; only "Register
  // another child" (another=1) jumps straight to the form.
  const scrollPending = useRef(Boolean(initial) && Boolean(another))
  const formRef = useRef<HTMLElement>(null)
  const radiosRef = useRef<HTMLFieldSetElement>(null)
  const selected = rows.find(row => row.offeringId === selectedId) ?? null

  // Load every selectable session's offering up front, so the form opens
  // instantly on tap instead of waiting on a fetch.
  useEffect(() => {
    let cancelled = false
    for (const row of rows) {
      if (!selectable(row)) continue
      getOffering(row.offeringId)
        .catch(() => null)
        .then(offering => { if (!cancelled) setOfferings(prev => ({ ...prev, [row.offeringId]: offering })) })
    }
    if (another) setPrefill(readLastEventParent())
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // After a pick, scroll down so the form section's heading is at the top.
  useEffect(() => {
    if (!selectedId || !scrollPending.current) return
    scrollPending.current = false
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [selectedId])

  function choose(row: Row) {
    if (row.offeringId === selectedId) {
      // Tapping the picked session again just brings the form back into view.
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    scrollPending.current = true
    setSelectedId(row.offeringId)
    trackEvent('quick_book_session_selected', { offeringId: row.offeringId })
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('session', row.key)
      url.searchParams.delete('offering')
      window.history.replaceState(null, '', url)
    } catch { /* URL sync is a convenience only */ }
  }

  function change() {
    radiosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    radiosRef.current?.querySelector<HTMLInputElement>('input:checked')?.focus({ preventScroll: true })
  }

  const state: QuickBookState = {
    id, formId, rows, themeNames, selected, selectable, choose, change, radiosRef, formRef,
    multiTheme: new Set(rows.map(row => row.theme)).size > 1,
    offering: selectedId ? offerings[selectedId] : undefined,
    prefill, programId, programTitle, contactHref,
  }
  return <QuickBookContext.Provider value={state}>{children}</QuickBookContext.Provider>
}

/** The session buttons, shown in the hero. Picking one opens QuickBookForm. */
export function QuickBookSessions() {
  const { id, formId, rows, multiTheme, themeNames, selected, selectable, choose, radiosRef } = useQuickBook()
  return (
    <div id={id} className="scroll-mt-24 rounded-3xl bg-white p-4 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:p-5">
      <fieldset ref={radiosRef} className="scroll-mt-24">
        <legend className="mb-2 text-sm font-black text-slate-800">Choose a session</legend>
        <div className="grid gap-2">
          {rows.map(row => {
            const enabled = selectable(row)
            const checked = row.offeringId === selected?.offeringId
            // Open sessions show a count only once it's low (3 or fewer,
            // see publicSeatsLeft); otherwise no badge at all.
            const badge = row.state === 'open'
              ? (row.seatsLeft ? { text: row.seatsLeft === 1 ? '1 spot available' : `${row.seatsLeft} spots available`, cls: 'bg-[#FFF1E0] text-[#A85A00]' } : null)
              : row.state === 'full'
                ? { text: row.waitlistOpen ? 'Full – join waitlist' : 'Full', cls: 'bg-slate-100 text-slate-600' }
                : { text: 'Closed', cls: 'bg-slate-100 text-slate-500' }
            return (
              <label
                key={row.offeringId}
                className={`flex items-center gap-3 rounded-2xl border-2 bg-white px-3.5 py-3 transition-colors ${
                  !enabled ? 'cursor-not-allowed opacity-60' : checked ? 'cursor-pointer border-[#0A2D5A] shadow-[0_0_0_3px_rgba(10,45,90,0.1)]' : 'cursor-pointer border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-session`}
                  value={row.key}
                  checked={checked}
                  disabled={!enabled}
                  onChange={() => choose(row)}
                  onClick={() => checked && choose(row)}
                  aria-controls={formId}
                  className="h-5 w-5 shrink-0 accent-[#0A2D5A]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-black leading-tight text-[#0A2D5A]">{row.dayLabel} · {row.part}</span>
                  <span className="block text-sm font-semibold text-slate-700 tabular-nums">{row.time}{multiTheme && themeNames[row.theme] ? ` · ${themeNames[row.theme]}` : ''}</span>
                  <span className={`block text-xs font-semibold ${row.earlyBirdUntil ? 'text-[#0c6162]' : 'text-slate-500'}`}>
                    {money(row.priceCents)}{row.earlyBirdUntil ? ` · Early bird until ${row.earlyBirdUntil}` : ''}
                  </span>
                </span>
                {badge && <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${badge.cls}`}>{badge.text}</span>}
              </label>
            )
          })}
        </div>
      </fieldset>
      {selected && (
        <a href={`#${formId}`} className="mt-3 block text-center text-sm font-bold text-[#0c6162] underline underline-offset-2 md:hidden">
          ↓ Your registration form is below
        </a>
      )}
    </div>
  )
}

/** The registration form section, placed right under the hero. Empty until a session is picked. */
export function QuickBookForm() {
  const { formId, selected, change, formRef, offering, prefill, programId, programTitle, contactHref } = useQuickBook()
  // Always the same <section> element (empty until a pick), so observers
  // such as StickyReserveBar keep watching the right node.
  if (!selected) return <section id={formId} ref={formRef} aria-hidden="true" />

  const registerHref = `/booking/${programId}/register?${new URLSearchParams({ offeringId: selected.offeringId, registrationType: 'demo' })}`
  let form: React.ReactNode
  if (offering === undefined) {
    form = <p className="py-6 text-center text-sm text-slate-500">Loading the registration form…</p>
  } else if (offering === null) {
    form = (
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
        We couldn’t load the form here. <a href={registerHref} className="font-bold text-[#0c6162] underline">Open the registration page</a> or{' '}
        <a href={contactHref} className="font-bold text-[#0c6162] underline">text us</a>.
      </p>
    )
  } else if (isDemoOfferingPubliclyFull(offering) && !(offering.waitlistEnabled === true && isOfferingRequestWindowOpen(offering))) {
    form = (
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
        This session just filled up. Please choose another time, or <a href={contactHref} className="font-bold text-[#0c6162] underline">text us</a>.
      </p>
    )
  } else {
    form = (
      <Suspense fallback={null}>
        <DemoRegisterForm
          programId={programId}
          program={{ title: programTitle }}
          offering={offering}
          mode={isDemoOfferingPubliclyFull(offering) ? 'waitlist' : 'register'}
          embedded
          prefill={prefill}
        />
      </Suspense>
    )
  }

  return (
    <section
      id={formId}
      ref={formRef}
      aria-labelledby={`${formId}-title`}
      className="scroll-mt-20 bg-[#FFF7E8] px-4 pb-12 pt-6 sm:px-8 sm:pt-10"
    >
      <div className="mx-auto max-w-xl">
        <h2 id={`${formId}-title`} className="mb-3 text-2xl font-black text-[#0A2D5A]">
          {selected.state === 'open' ? 'Register your child' : 'Join the waitlist'}
        </h2>
        <div className="flex items-center justify-between gap-3 rounded-t-2xl bg-[#0A2D5A] px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="text-sm font-black leading-tight">{selected.dayLabel} · {selected.part}</p>
            <p className="text-xs text-[#c9d6e6] tabular-nums">
              {selected.time} · {selected.state === 'open' ? `${money(selected.priceCents)}${selected.taxCents ? ' incl. HST' : ''}` : 'Waitlist (free to join)'}
            </p>
          </div>
          <button type="button" onClick={change} className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-[#F2A100] underline underline-offset-2">
            Change
          </button>
        </div>
        <div className="rounded-b-2xl border border-t-0 border-slate-200 bg-white p-4 shadow-sm sm:p-6">{form}</div>
      </div>
    </section>
  )
}
