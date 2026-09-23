'use client'

import { useEffect, useRef, useState } from 'react'
import { ALLOWED_ATTRIBUTION_PARAMS, trackEvent } from '../../lib/analytics'

// Inline "next demo" waitlist form for the evergreen /demo page.
//
// It is NOT a second lead pipeline: it posts the same payload, to the same
// endpoint (submit-demo-waitlist.js), as the waitlist mode of the register
// page — one `waitlist` doc, waitlistType 'demo', same portal tab, same
// acknowledgement email. The only reason it lives here rather than linking
// out is conversion: most visitors arrive from Facebook/Instagram on a
// phone, and a form in front of them converts better than one a tap away.
//
// The one added field is the optional program interest, which the endpoint
// stores as a plain tag for staff follow-up.
const PROGRAM_INTEREST_OPTIONS = [
  { value: 'smartivo', label: 'Smartivo (ages 4–7)' },
  { value: 'bricks-challenge', label: 'Bricks Challenge (ages 7–12)' },
  { value: 'algo-play', label: 'Algo Play (ages 9–12)' },
  { value: 'not-sure', label: 'Not sure yet' },
]

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0c6162] focus:ring-2 focus:ring-[#0c6162]/20'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">
        {label} {required && <span className="text-[#ED174B]">*</span>}
      </span>
      {children}
    </label>
  )
}

// Default wording is for the evergreen "next demo" waitlist; /demo/waitlist
// passes workshop-list wording for the same list.
const DEFAULT_COPY = {
  success: 'We’ll notify you as soon as registration for our next Young Engineers Kanata Demo opens.',
  consent: 'I confirm this information is accurate and consent to Kriana contacting me about the next Young Engineers demo and related programs.',
  submit: 'Join the Next Demo Waitlist',
  footnote: 'No payment required. We’ll notify you when registration for our next demo opens.',
}
export type WaitlistFormCopy = typeof DEFAULT_COPY

export function DemoWaitlistForm({
  programId,
  offeringId,
  classesHref,
  copy = DEFAULT_COPY,
}: {
  programId: string
  offeringId: string
  classesHref: string
  copy?: WaitlistFormCopy
}) {
  const clientRequestId = useRef('')
  const [form, setForm] = useState({
    parentName: '', childName: '', childAge: '', parentEmail: '', parentPhone: '',
    programInterest: '', consentAccepted: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ reference: string } | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    clientRequestId.current = globalThis.crypto?.randomUUID?.()
      ?? `demo-waitlist-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }, [])

  function set(field: keyof typeof form, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
    // Fires once, on the first real interaction — not on mount, so simply
    // scrolling past the form doesn't look like an abandoned signup.
    if (!startedRef.current) {
      startedRef.current = true
      trackEvent('demo_waitlist_started', { offeringId })
    }
  }

  // Same allowlisted params the register page reads, so a waitlist join from
  // a flyer QR or an Instagram link keeps its attribution.
  function buildAttribution() {
    const params: Record<string, string> = {}
    try {
      const search = new URLSearchParams(window.location.search)
      for (const key of ALLOWED_ATTRIBUTION_PARAMS) {
        const value = search.get(key)
        if (value) params[key] = value.slice(0, 100)
      }
    } catch {
      // No window.location.search to read — attribution is simply absent.
    }
    let referrer: string | null = null
    try { referrer = document.referrer ? new URL(document.referrer).origin : null } catch { referrer = null }

    return {
      landingPath: '/demo',
      source: params.utm_source ?? params.ref ?? null,
      medium: params.utm_medium ?? null,
      campaign: params.utm_campaign ?? null,
      content: params.utm_content ?? null,
      term: params.utm_term ?? null,
      referrer,
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.consentAccepted) { setError('Please accept the consent to continue.'); return }
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/.netlify/functions/submit-demo-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          demoOfferingId: offeringId,
          clientRequestId: clientRequestId.current,
          programInterest: form.programInterest || null,
          registration: {
            parentName: form.parentName,
            parentEmail: form.parentEmail,
            parentPhone: form.parentPhone,
            childName: form.childName,
            childAge: form.childAge,
            consentAccepted: form.consentAccepted,
          },
          marketingAttribution: buildAttribution(),
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'We could not add you to the waitlist. Please try again.')
      }

      trackEvent('demo_waitlist_submitted', { offeringId })
      setDone({ reference: result.reference ?? '' })
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <h3 className="text-2xl font-black text-[#0A2D5A]">You&apos;re on the list! 🎉</h3>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-600">
            {copy.success}
          </p>
          {done.reference && (
            <div className="mx-auto mt-5 inline-block rounded-xl bg-slate-50 px-5 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Waitlist reference</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-slate-700">{done.reference}</p>
            </div>
          )}
        </div>

        <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
          <p className="text-lg font-black text-slate-800">Don&apos;t want to wait?</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Our regular Young Engineers programs are enrolling now.
          </p>
          <a
            href={classesHref}
            onClick={() => trackEvent('demo_classes_cta_clicked', { offeringId, content: 'waitlist_success' })}
            className="mt-4 inline-block w-full rounded-xl px-6 py-4 text-center text-base font-black text-white shadow-sm transition-transform active:scale-[0.98]"
            style={{ backgroundColor: '#0c6162' }}
          >
            View Classes &amp; Schedule
          </a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
      )}

      <Field label="Parent / Guardian Name" required>
        <input required className={inputClass} autoComplete="name" placeholder="Jane Smith"
          value={form.parentName} onChange={e => set('parentName', e.target.value)} />
      </Field>
      <Field label="Child's Name" required>
        <input required className={inputClass} placeholder="Alex Smith"
          value={form.childName} onChange={e => set('childName', e.target.value)} />
      </Field>
      <Field label="Child's Age" required>
        <input required type="number" inputMode="numeric" min={1} max={18} className={inputClass} placeholder="8"
          value={form.childAge} onChange={e => set('childAge', e.target.value)} />
      </Field>
      <Field label="Email" required>
        <input required type="email" className={inputClass} autoComplete="email" placeholder="jane@example.com"
          value={form.parentEmail} onChange={e => set('parentEmail', e.target.value)} />
      </Field>
      <Field label="Mobile Number" required>
        <input required type="tel" className={inputClass} autoComplete="tel" placeholder="(613) 555-0000"
          value={form.parentPhone} onChange={e => set('parentPhone', e.target.value)} />
      </Field>
      <Field label="Which program are you interested in? (optional)">
        <select className={inputClass} value={form.programInterest} onChange={e => set('programInterest', e.target.value)}>
          <option value="">Select a program</option>
          {PROGRAM_INTEREST_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </Field>

      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" required checked={form.consentAccepted}
          onChange={e => set('consentAccepted', e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#0c6162]" />
        <span className="text-sm leading-relaxed text-slate-600">
          {copy.consent} <span className="text-[#ED174B]">*</span>
        </span>
      </label>

      <button type="submit" disabled={submitting}
        className="w-full rounded-xl px-6 py-4 text-base font-black text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
        style={{ backgroundColor: '#F2A100' }}>
        {submitting ? 'Submitting…' : copy.submit}
      </button>
      <p className="text-center text-xs text-slate-400">
        {copy.footnote}
      </p>
    </form>
  )
}
