'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { trackEvent } from '../../lib/analytics'
import {
  MEDIA_CONSENT_ACKNOWLEDGEMENT,
  MEDIA_CONSENT_CHOICES,
} from '../../lib/media-consent'

type Choice = 'YES' | 'NO'
// An event (sessions + date) or the general consent (no sessions, no date).
export type ConsentContext = {
  id: string
  dateLabel?: string
  sessions: { id: string; label: string }[]
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#0c6162] focus:ring-2 focus:ring-[#0c6162]/20'

function Field({ id, label, hint, optional, children }: {
  id: string
  label: string
  hint?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-slate-700">
        {label}{' '}
        {optional
          ? <span className="font-medium text-slate-500">(optional)</span>
          : <span className="text-[#ED174B]" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  )
}

function newRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `media-consent-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const EMPTY_CHILD = { childName: '', choice: '' as Choice | '', signature: '' }

export function MediaConsentForm({
  event,
  initialSessionId = '',
  backHref,
  backLabel,
}: {
  event: ConsentContext
  initialSessionId?: string
  backHref: string
  backLabel: string
}) {
  const isEvent = event.sessions.length > 0
  const clientRequestId = useRef('')
  const errorRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef<HTMLHeadingElement>(null)
  const [form, setForm] = useState({
    parentName: '', parentEmail: '', parentPhone: '', sessionId: initialSessionId, programName: '', website: '', ...EMPTY_CHILD,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ childName: string; choice: Choice; updatedPrevious: boolean } | null>(null)
  const today = new Intl.DateTimeFormat('en-CA', { dateStyle: 'long' }).format(new Date())

  useEffect(() => { clientRequestId.current = newRequestId() }, [])
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])
  useEffect(() => { if (done) doneRef.current?.focus() }, [done])

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(submitEvent: React.FormEvent) {
    submitEvent.preventDefault()
    if (!form.choice) { setError('Please choose YES or NO for photo permission.'); return }
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/.netlify/functions/submit-media-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          clientRequestId: clientRequestId.current,
          parentName: form.parentName,
          childName: form.childName,
          parentEmail: form.parentEmail,
          parentPhone: form.parentPhone,
          sessionId: form.sessionId || 'unknown',
          programName: isEvent ? '' : form.programName,
          choice: form.choice,
          signature: form.signature,
          website: form.website,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'We could not save your consent response. Please try again.')

      trackEvent('media_consent_submitted', { eventId: event.id })
      setDone({ childName: form.childName, choice: form.choice, updatedPrevious: result.updatedPrevious === true })
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Keeps the parent's details so a sibling's response is quick.
  function startAnotherChild() {
    clientRequestId.current = newRequestId()
    setForm(prev => ({ ...prev, ...EMPTY_CHILD }))
    setDone(null)
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <h2 ref={doneRef} tabIndex={-1} className="text-2xl font-black text-[#0A2D5A] outline-none">
          Consent received ✓
        </h2>
        <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-slate-600">
          Thank you — your consent response has been received.
        </p>
        <p className="mx-auto mt-4 max-w-md rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-bold">{done.childName}:</span>{' '}
          {done.choice === 'YES' ? 'YES — permission given' : 'NO — permission not given'}
          {done.updatedPrevious && (
            <span className="mt-1 block text-xs text-slate-500">This replaces your earlier response for this child.</span>
          )}
        </p>

        <div className="mt-7 rounded-2xl bg-[#0A2D5A] p-6 text-white">
          <p className="text-lg font-black">
            {event.dateLabel ? `Want a quick preview before ${event.dateLabel.replace(/, \d{4}$/, '')}?` : 'Want a quick preview?'}
          </p>
          <Link
            href="/gallery"
            onClick={() => trackEvent('media_consent_gallery_clicked', { eventId: event.id })}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FFD166] px-6 py-3 text-base font-black text-[#0A2D5A] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98] sm:w-auto"
          >
            <span aria-hidden="true">▶</span> Watch Young Engineers in Action
          </Link>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 text-sm font-bold sm:flex-row sm:justify-center sm:gap-6">
          <button type="button" onClick={startAnotherChild} className="inline-flex min-h-11 items-center text-[#0c6162] underline-offset-4 hover:underline">
            Submit for another child
          </button>
          <Link href={backHref} className="inline-flex min-h-11 items-center text-[#0c6162] underline-offset-4 hover:underline">
            {backLabel}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      {error && (
        <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 outline-none">
          {error}
        </div>
      )}

      <fieldset>
        <legend className="text-lg font-black text-[#0A2D5A]">
          Photo permission <span className="text-[#ED174B]" aria-hidden="true">*</span>
        </legend>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{MEDIA_CONSENT_ACKNOWLEDGEMENT}</p>
        <div className="mt-4 space-y-3">
          {(['YES', 'NO'] as const).map(choice => (
            <label
              key={choice}
              className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border-2 border-slate-200 p-4 transition-colors has-[:checked]:border-[#0c6162] has-[:checked]:bg-[#F1F8F8] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0c6162]/40"
            >
              <input
                type="radio"
                name="choice"
                value={choice}
                required
                checked={form.choice === choice}
                onChange={() => set('choice', choice)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#0c6162]"
              />
              <span className="text-sm leading-relaxed text-slate-600">
                <span className="block text-base font-black text-slate-800">{MEDIA_CONSENT_CHOICES[choice].label}</span>
                {MEDIA_CONSENT_CHOICES[choice].detail}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Either answer is welcome. Your choice does not affect your child&apos;s participation{isEvent ? ' in the workshop' : ' in any activity'}.
        </p>
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-100 pt-6">
        <legend className="mb-4 text-lg font-black text-[#0A2D5A]">Parent / Guardian information</legend>
        <Field id="mc-parent" label="Parent / Guardian Name">
          <input id="mc-parent" required autoComplete="name" className={inputClass}
            value={form.parentName} onChange={e => set('parentName', e.target.value)} />
        </Field>
        <Field id="mc-child" label="Child's Name" hint="Have more than one child with us? Submit once for each child.">
          <input id="mc-child" required aria-describedby="mc-child-hint" autoComplete="off" className={inputClass}
            value={form.childName} onChange={e => set('childName', e.target.value)} />
        </Field>
        <Field id="mc-email" label="Email">
          <input id="mc-email" required type="email" autoComplete="email" inputMode="email" className={inputClass}
            value={form.parentEmail} onChange={e => set('parentEmail', e.target.value)} />
        </Field>
        <Field id="mc-phone" label="Phone">
          <input id="mc-phone" required type="tel" autoComplete="tel" className={inputClass}
            value={form.parentPhone} onChange={e => set('parentPhone', e.target.value)} />
        </Field>
        {isEvent ? (
          <Field id="mc-session" label="Workshop session" optional>
            <select id="mc-session" className={inputClass} value={form.sessionId} onChange={e => set('sessionId', e.target.value)}>
              <option value="">Not sure / skip</option>
              {event.sessions.map(session => (
                <option key={session.id} value={session.id}>{session.label}</option>
              ))}
            </select>
          </Field>
        ) : (
          <Field id="mc-program" label="Program or event" optional hint="For example: Bricks Challenge Saturday class, summer camp, a birthday party.">
            <input id="mc-program" aria-describedby="mc-program-hint" autoComplete="off" className={inputClass}
              value={form.programName} onChange={e => set('programName', e.target.value)} />
          </Field>
        )}
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-100 pt-6">
        <legend className="mb-4 text-lg font-black text-[#0A2D5A]">Signature</legend>
        <Field id="mc-signature" label="Type your full name to sign" hint="Typing your name here acts as your signature on this consent form.">
          <input id="mc-signature" required autoComplete="name" aria-describedby="mc-signature-hint"
            className={`${inputClass} font-serif text-lg italic`}
            value={form.signature} onChange={e => set('signature', e.target.value)} />
        </Field>
        <p className="text-sm text-slate-600">
          <span className="font-bold text-slate-700">Date:</span> {today}{' '}
          <span className="text-xs text-slate-500">(recorded automatically when you submit)</span>
        </p>
      </fieldset>

      {/* Honeypot — hidden from people and assistive tech, filled in by bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="mc-website">Website</label>
        <input id="mc-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={e => set('website', e.target.value)} />
      </div>

      <button type="submit" disabled={submitting}
        className="min-h-14 w-full rounded-xl bg-[#0c6162] px-6 py-4 text-base font-black text-white shadow-sm transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0c6162] active:scale-[0.98] disabled:opacity-60">
        {submitting ? 'Submitting…' : 'Submit Consent Response'}
      </button>
    </form>
  )
}
