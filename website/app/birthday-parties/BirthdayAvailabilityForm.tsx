'use client'

import { useRef, useState } from 'react'
import { TimeSelect } from '../../components/TimeSelect'

const inputClass =
  'w-full min-h-[44px] border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#ED174B]/30 focus:border-[#ED174B] transition-all bg-white'

type FormState = {
  parentName: string
  parentEmail: string
  parentPhone: string
  childName: string
  childAge: string
  preferredDate: string
  preferredStartTime: string
  alternateDate: string
  alternateStartTime: string
  partyLocation: string
  expectedChildCount: string
  notes: string
  accessibilityNotes: string
  consentAccepted: boolean
  website: string // honeypot — must stay empty
}

const EMPTY_FORM: FormState = {
  parentName: '',
  parentEmail: '',
  parentPhone: '',
  childName: '',
  childAge: '',
  preferredDate: '',
  preferredStartTime: '',
  alternateDate: '',
  alternateStartTime: '',
  partyLocation: '',
  expectedChildCount: '8',
  notes: '',
  accessibilityNotes: '',
  consentAccepted: false,
  website: '',
}

function Field({
  id, label, children, required, hint, error,
}: { id: string; label: string; children: React.ReactNode; required?: boolean; hint?: string; error?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1">
        {label} {required && <span aria-hidden="true" className="text-[#ED174B]">*</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {hint && <p className="text-xs text-slate-400 mb-1.5">{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-semibold text-[#ED174B]">
          {error}
        </p>
      )}
    </div>
  )
}

function todayLocalDateString() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function BirthdayAvailabilityForm({ programId }: { programId: string }) {
  const clientRequestId = useRef('')
  if (!clientRequestId.current) {
    clientRequestId.current =
      globalThis.crypto?.randomUUID?.() ?? `birthday-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ requestNumber: string; requiresCapacityReview: boolean } | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!form.parentName.trim()) errors.parentName = 'Please enter the parent or guardian name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail.trim())) errors.parentEmail = 'Please enter a valid email address.'
    if (form.parentPhone.replace(/\D/g, '').length < 7) errors.parentPhone = 'Please enter a valid phone number.'
    if (!form.childName.trim()) errors.childName = "Please enter the birthday child's name."
    const age = Number(form.childAge)
    if (!Number.isInteger(age) || age < 1 || age > 17) errors.childAge = 'Please enter an age between 1 and 17.'
    if (!form.preferredDate) errors.preferredDate = 'Please choose a preferred party date.'
    else if (form.preferredDate < todayLocalDateString()) errors.preferredDate = 'Preferred date cannot be in the past.'
    if (!form.preferredStartTime) errors.preferredStartTime = 'Please choose a preferred start time.'
    if (form.alternateDate && form.alternateDate < todayLocalDateString()) errors.alternateDate = 'Alternate date cannot be in the past.'
    if (!form.partyLocation.trim()) errors.partyLocation = 'Please enter the party location or venue details.'
    const count = Number(form.expectedChildCount)
    if (!Number.isInteger(count) || count < 1) errors.expectedChildCount = 'Please enter a valid number of children.'
    if (!form.consentAccepted) errors.consentAccepted = 'Please confirm you understand this is an availability request, not a confirmed booking.'
    return errors
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    if (!programId) {
      setFormError('Birthday availability requests are not open right now. Please contact us directly.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/.netlify/functions/submit-birthday-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          clientRequestId: clientRequestId.current,
          ...form,
          expectedChildCount: Number(form.expectedChildCount),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'We could not submit your request. Please try again.')
      setResult({ requestNumber: data.requestNumber, requiresCapacityReview: Boolean(data.requiresCapacityReview) })
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
        <h3 className="text-lg font-bold text-emerald-800">Request received</h3>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800">
          Thanks — your birthday availability request has been received. Your preferred date is not confirmed yet.
          Our team will review availability and contact you with the next steps and payment details.
        </p>
        <p className="mt-3 text-xs font-semibold text-emerald-700">Reference: {result.requestNumber}</p>
        {result.requiresCapacityReview && (
          <p className="mt-2 text-xs font-semibold text-amber-700">
            Your requested group is larger than 8 children, so our team will follow up to confirm capacity before approving.
          </p>
        )}
      </div>
    )
  }

  const errorCount = Object.keys(fieldErrors).length

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {errorCount > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby="birthday-form-error-heading"
          className="rounded-xl border border-[#ED174B]/30 bg-[#ED174B]/5 px-4 py-3.5 focus:outline-none"
        >
          <p id="birthday-form-error-heading" className="text-sm font-bold text-[#ED174B]">
            Please fix the following before submitting:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#ED174B]">
            {Object.entries(fieldErrors).map(([field, message]) => (
              <li key={field}>
                <a href={`#${field}`} className="underline underline-offset-2">{message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {formError && (
        <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {formError}
        </div>
      )}

      {/* Honeypot — hidden from sighted users and screen readers, real visitors never fill it in */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={e => set('website', e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="parentName" label="Parent / Guardian Name" required error={fieldErrors.parentName}>
          <input
            id="parentName" required className={inputClass} value={form.parentName}
            onChange={e => set('parentName', e.target.value)} autoComplete="name"
            aria-invalid={!!fieldErrors.parentName} aria-describedby={fieldErrors.parentName ? 'parentName-error' : undefined}
          />
        </Field>
        <Field id="parentEmail" label="Email" required error={fieldErrors.parentEmail}>
          <input
            id="parentEmail" required type="email" className={inputClass} value={form.parentEmail}
            onChange={e => set('parentEmail', e.target.value)} autoComplete="email"
            aria-invalid={!!fieldErrors.parentEmail} aria-describedby={fieldErrors.parentEmail ? 'parentEmail-error' : undefined}
          />
        </Field>
        <Field id="parentPhone" label="Phone Number" required error={fieldErrors.parentPhone}>
          <input
            id="parentPhone" required type="tel" className={inputClass} value={form.parentPhone}
            onChange={e => set('parentPhone', e.target.value)} autoComplete="tel"
            aria-invalid={!!fieldErrors.parentPhone} aria-describedby={fieldErrors.parentPhone ? 'parentPhone-error' : undefined}
          />
        </Field>
        <Field id="childName" label="Birthday Child's Name" required error={fieldErrors.childName}>
          <input
            id="childName" required className={inputClass} value={form.childName}
            onChange={e => set('childName', e.target.value)}
            aria-invalid={!!fieldErrors.childName} aria-describedby={fieldErrors.childName ? 'childName-error' : undefined}
          />
        </Field>
        <Field id="childAge" label="Child's Age" required hint="Ages 6-12 recommended" error={fieldErrors.childAge}>
          <input
            id="childAge" required type="number" min={1} max={17} className={inputClass} value={form.childAge}
            onChange={e => set('childAge', e.target.value)}
            aria-invalid={!!fieldErrors.childAge} aria-describedby={fieldErrors.childAge ? 'childAge-error' : undefined}
          />
        </Field>
        <Field id="expectedChildCount" label="Expected Number of Children" required hint="Up to 8 included" error={fieldErrors.expectedChildCount}>
          <input
            id="expectedChildCount" required type="number" min={1} className={inputClass} value={form.expectedChildCount}
            onChange={e => set('expectedChildCount', e.target.value)}
            aria-invalid={!!fieldErrors.expectedChildCount} aria-describedby={fieldErrors.expectedChildCount ? 'expectedChildCount-error' : undefined}
          />
        </Field>
        <Field id="preferredDate" label="Preferred Party Date" required error={fieldErrors.preferredDate}>
          <input
            id="preferredDate" required type="date" min={todayLocalDateString()} className={inputClass} value={form.preferredDate}
            onChange={e => set('preferredDate', e.target.value)}
            aria-invalid={!!fieldErrors.preferredDate} aria-describedby={fieldErrors.preferredDate ? 'preferredDate-error' : undefined}
          />
        </Field>
        <Field id="preferredStartTime" label="Preferred Start Time" required error={fieldErrors.preferredStartTime}>
          <TimeSelect
            id="preferredStartTime" required className={inputClass} value={form.preferredStartTime}
            onChange={value => set('preferredStartTime', value)}
            aria-invalid={!!fieldErrors.preferredStartTime} aria-describedby={fieldErrors.preferredStartTime ? 'preferredStartTime-error' : undefined}
          />
        </Field>
        <Field id="alternateDate" label="Alternate Date (optional)" error={fieldErrors.alternateDate}>
          <input
            id="alternateDate" type="date" min={todayLocalDateString()} className={inputClass} value={form.alternateDate}
            onChange={e => set('alternateDate', e.target.value)}
            aria-invalid={!!fieldErrors.alternateDate} aria-describedby={fieldErrors.alternateDate ? 'alternateDate-error' : undefined}
          />
        </Field>
        <Field id="alternateStartTime" label="Alternate Start Time (optional)">
          <TimeSelect
            id="alternateStartTime" className={inputClass} value={form.alternateStartTime}
            onChange={value => set('alternateStartTime', value)}
          />
        </Field>
      </div>

      <Field id="partyLocation" label="Party Location / Venue Details" required hint="Address or venue name, e.g. home, community centre" error={fieldErrors.partyLocation}>
        <input
          id="partyLocation" required className={inputClass} value={form.partyLocation}
          onChange={e => set('partyLocation', e.target.value)}
          aria-invalid={!!fieldErrors.partyLocation} aria-describedby={fieldErrors.partyLocation ? 'partyLocation-error' : undefined}
        />
      </Field>

      <Field id="notes" label="Notes or Questions (optional)">
        <textarea id="notes" rows={3} className={inputClass} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </Field>

      <Field id="accessibilityNotes" label="Accessibility, Allergy, or Preparation Notes (optional)">
        <textarea
          id="accessibilityNotes" rows={3} className={inputClass} value={form.accessibilityNotes}
          onChange={e => set('accessibilityNotes', e.target.value)}
        />
      </Field>

      <label htmlFor="consentAccepted" className="flex items-start gap-3 cursor-pointer">
        <input
          id="consentAccepted" type="checkbox" required checked={form.consentAccepted}
          onChange={e => set('consentAccepted', e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#ED174B]"
          aria-invalid={!!fieldErrors.consentAccepted} aria-describedby={fieldErrors.consentAccepted ? 'consentAccepted-error' : undefined}
        />
        <span className="text-sm text-slate-600">
          I understand this form requests availability only. My preferred date is not confirmed until Kriana staff
          approve availability and payment is received. <span aria-hidden="true" className="text-[#ED174B]">*</span>
          <span className="sr-only"> (required)</span>
        </span>
      </label>
      {fieldErrors.consentAccepted && (
        <p id="consentAccepted-error" className="-mt-3 text-xs font-semibold text-[#ED174B]">{fieldErrors.consentAccepted}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full min-h-[44px] rounded-full bg-[#0c6162] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_8px_32px_rgba(12,97,98,0.35)] transition-all duration-300 motion-safe:hover:scale-[1.01] hover:bg-[#0a5051] disabled:opacity-50 disabled:hover:scale-100"
      >
        {submitting ? 'Submitting…' : 'Check Birthday Availability'}
      </button>
      <p className="text-center text-xs text-slate-400">
        Submitting this form requests availability only — it does not confirm a booking or collect payment.
      </p>
    </form>
  )
}
