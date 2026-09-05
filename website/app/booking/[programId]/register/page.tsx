'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getProgram, getOffering, getPackageClassSchedule, formatOfferingDateRange, formatOfferingWeeklySchedule,
  isOfferingRequestWindowOpen, isOfferingSoldOut, programUsesOfferings, applyProgramDiscount,
  formatEventDateTime, formatEventTimeRange,
} from '../../../../lib/booking'
import { trackEvent, ALLOWED_ATTRIBUTION_PARAMS } from '../../../../lib/analytics'
import BookingLayout from '../../../../components/booking/BookingLayout'
import { BookingStepper } from '../../../../components/booking/BookingStepper'
import { ClassScheduleDisclosure } from '../../../../components/booking/ClassScheduleDisclosure'
import { MonthlyTuitionInfo } from '../../../../components/booking/MonthlyTuitionInfo'
import {
  PACKAGE_PROMO, getRoboticsPackage, isValidPackageId,
  getPaymentOptionsLabel, resolvePackagePricing,
} from '../../../../lib/robotics-packages.js'
import { getLearningPathMonthlyTuition, getRegularMonthlyEstimate } from '../../../../lib/robotics-monthly-tuition.js'

const ROBOTICS_CATEGORY = 'Robotics'
const AGE_OPTIONS = [5, 6, 7, 8, 9, 10, 11, 12, 13]

function Field({ label, children, required, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-slate-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

const inputClass = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0c6162]/30 focus:border-[#0c6162] transition-all bg-white'

// ─── $10 Young Engineers Demo Registration ─────────────────────────────────
//
// Intentionally minimal — a 5-field form (parentName, parentEmail,
// parentPhone, childName, childAge) plus required consent. No medicalNotes,
// emergencyContact, specialRequests, childGrade, or photoConsent — those
// belong to the separate request_only enrollment form and are not part of
// this product's spec. This component only renders when the program page's
// demo CTA linked here (which itself only appears when
// NEXT_PUBLIC_ENABLE_DEMO_PAYMENTS === 'true' and a published demo offering
// exists), so in production today this code path is unreachable — but it
// must still be correct and complete for when the flag is flipped on.
function DemoRegisterForm({ programId, program, offering }: { programId: string; program: any; offering: any }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientRequestId = useRef('')
  const [form, setFormState] = useState({
    parentName: '', parentEmail: '', parentPhone: '', childName: '', childAge: '', consentAccepted: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!clientRequestId.current) {
      clientRequestId.current = globalThis.crypto?.randomUUID?.()
        ?? `demo-request-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
    trackEvent('demo_registration_started', { offeringId: offering?.id ?? null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reads the same allowlisted params /demo appended to this page's CTA
  // link, plus the browser referrer's origin (never a full URL — no path or
  // query string). Missing/invalid attribution never blocks registration:
  // if nothing is present, every field below is simply null and the server
  // stores an all-null marketingAttribution object.
  function buildAttribution() {
    const params: Record<string, string> = {}
    for (const key of ALLOWED_ATTRIBUTION_PARAMS) {
      const value = searchParams.get(key)
      if (value) params[key] = value
    }
    let referrer: string | null = null
    try { referrer = document.referrer ? new URL(document.referrer).origin : null } catch { referrer = null }

    const hasAnyParam = Object.keys(params).length > 0
    return {
      landingPath: hasAnyParam ? '/demo' : null,
      source: params.utm_source ?? params.ref ?? null,
      medium: params.utm_medium ?? null,
      campaign: params.utm_campaign ?? null,
      content: params.utm_content ?? null,
      term: params.utm_term ?? null,
      referrer,
    }
  }

  function set(field: string, value: any) {
    setFormState(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.consentAccepted) { setError('Please accept the consent to continue.'); return }
    setError('')
    setSubmitting(true)

    try {
      const registerResponse = await fetch('/.netlify/functions/submit-demo-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          demoOfferingId: offering.id,
          clientRequestId: clientRequestId.current,
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
      const registerResult = await registerResponse.json().catch(() => ({}))
      if (!registerResponse.ok) throw new Error(registerResult.error || 'We could not submit your demo registration. Please try again.')

      trackEvent('demo_registration_submitted', { offeringId: offering?.id ?? null })

      // Payment is collected via e-transfer, not Stripe — send the family to
      // the instructions page with everything it needs already in hand, no
      // extra fetch (and no Firestore read, which demoRegistrations doesn't
      // allow client-side per firestore.rules).
      const params = new URLSearchParams({
        reference: registerResult.registrationNumber ?? '',
        demoRegistrationId: registerResult.demoRegistrationId ?? '',
        programId,
        program: program.title,
        eventTitle: offering.eventTitle ?? '',
        eventDate: formatEventDateTime(offering),
        eventTime: formatEventTimeRange(offering),
        eventLocation: offering.location ?? '',
      })
      router.push(`/booking/demo-etransfer?${params.toString()}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <BookingLayout backTo={`/booking/${programId}`} backLabel={program.title} maxWidth="max-w-xl">
      <BookingStepper step={2} />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #F2A100, #ED174B)' }} />
        <div className="px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">$10 Demo Class</p>
            <h2 className="font-black text-slate-800">{program.title}</h2>
            {/* This campaign's demo has a fixed date/time/location (set on
                the offering doc by an admin) — never say "we'll follow up
                to schedule," which is wrong once an offering carries a
                fixed event. Falls back to a generic line if the offering
                doesn't carry event fields. */}
            <p className="text-sm text-slate-500 mt-0.5">
              {formatEventDateTime(offering)
                ? `${formatEventDateTime(offering)}${offering.location ? ` · ${offering.location}` : ''}`
                : "Our team will follow up to confirm your child's demo class details."}
            </p>
            {/* Driven by program.learnMoreUrl (from robotics-content.ts, via
                the public-catalog allowlist) — works for any demo-eligible
                program without per-program code, same link used on the
                robotics program cards. */}
            {program.learnMoreUrl && (
              <a
                href={program.learnMoreUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-[#0c6162] hover:underline"
              >
                Learn more about {program.title}
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-black text-slate-800">$10 CAD</p>
            <p className="text-xs text-slate-400">one-time demo charge</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="mb-1">
          <h3 className="font-black text-slate-800 text-base">Register for the $10 Demo Class</h3>
          <p className="text-sm text-slate-400 mt-0.5">Just a few details to hold your child&apos;s demo spot.</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold text-amber-700">Try for $10 — Demo is FREE when you enroll.</p>
          <p className="text-sm text-amber-700 mt-1">The $10 is credited toward regular enrollment after your child attends.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">{error}</div>
        )}

        <Field label="Parent or Guardian's Full Name" required>
          <input required className={inputClass} value={form.parentName} onChange={e => set('parentName', e.target.value)} placeholder="Jane Smith" autoComplete="name" />
        </Field>
        <Field label="Email Address" required>
          <input required type="email" className={inputClass} value={form.parentEmail} onChange={e => set('parentEmail', e.target.value)} placeholder="jane@example.com" autoComplete="email" />
        </Field>
        <Field label="Phone Number" required>
          <input required type="tel" className={inputClass} value={form.parentPhone} onChange={e => set('parentPhone', e.target.value)} placeholder="(613) 555-0000" autoComplete="tel" />
        </Field>
        <Field label="Child's Full Name" required>
          <input required className={inputClass} value={form.childName} onChange={e => set('childName', e.target.value)} placeholder="Alex Smith" />
        </Field>
        <Field label="Child's Age" required>
          <input required type="number" min={1} max={18} className={inputClass} value={form.childAge} onChange={e => set('childAge', e.target.value)} placeholder="8" />
        </Field>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" required checked={form.consentAccepted} onChange={e => set('consentAccepted', e.target.checked)} className="mt-0.5 accent-[#0c6162] w-4 h-4 shrink-0" />
          <span className="text-sm text-slate-600">
            I confirm this information is accurate and consent to Kriana using it to register my child for {offering.eventTitle || 'this $10 demo class'} and contact me about this registration. <span className="text-red-500">*</span>
          </span>
        </label>

        <button type="submit" disabled={submitting} className="w-full py-4 rounded-xl text-white font-black text-base transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm" style={{ backgroundColor: '#F2A100' }}>
          {submitting ? 'Submitting…' : 'Register & Get E-Transfer Instructions →'}
        </button>
        <p className="text-center text-xs text-slate-400">You&apos;ll receive instructions to send your $10 CAD payment by e-transfer.</p>
      </form>
    </BookingLayout>
  )
}

function SubStepper({ step, steps }: { step: number; steps: string[] }) {
  return (
    <div className="flex items-center mb-6">
      {steps.map((label, i) => {
        const n = i + 1
        const state = n < step ? 'done' : n === step ? 'active' : 'upcoming'
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                state === 'done' ? 'bg-[#0c6162] text-white' : state === 'active' ? 'bg-[#0c6162] text-white ring-4 ring-[#0c6162]/20' : 'bg-slate-100 text-slate-400'
              }`}>
                {state === 'done'
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>
                  : n}
              </div>
              <span className={`text-[10px] sm:text-xs font-semibold text-center leading-tight max-w-[56px] ${
                state === 'active' ? 'text-slate-800' : state === 'done' ? 'text-[#0c6162]' : 'text-slate-400'
              }`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1.5 mb-4 ${step > n ? 'bg-[#0c6162]' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function RegisterForm() {
  const { programId } = useParams<{ programId: string }>()
  const searchParams = useSearchParams()
  const offeringId = searchParams.get('offeringId') ?? ''
  const legacySessionId = searchParams.get('sessionId') ?? ''
  const selectedOfferingId = offeringId || legacySessionId
  const isWaitlistParam = searchParams.get('waitlist') === '1'
  const packageIdParam = searchParams.get('package') ?? ''
  const isDemoRegistration = searchParams.get('registrationType') === 'demo'
  const router = useRouter()
  const clientRequestId = useRef('')

  const [program, setProgram] = useState<any>(null)
  const [offering, setOffering] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [subStep, setSubStep] = useState(1)

  const [form, setFormState] = useState({
    parentName: '', parentEmail: '', parentPhone: '', childName: '',
    childAge: '', childGrade: '', medicalNotes: '', emergencyContact: '',
    specialRequests: '', consentAccepted: false, photoConsent: false,
  })
  // Preselected to Pay in Full, which only Explorer (internal, never publicly
  // listed) still uses. Every public package is billed monthly and always
  // resolves to 'recurring_monthly' regardless of this state — see
  // effectiveMethod below.
  const [paymentPreference, setPaymentPreference] = useState<{ method: 'pay_in_full' | 'recurring_monthly' }>({
    method: 'pay_in_full',
  })

  useEffect(() => {
    if (!clientRequestId.current) {
      clientRequestId.current = globalThis.crypto?.randomUUID?.()
        ?? `request-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }

    async function load() {
      if (!selectedOfferingId) { setLoading(false); return }
      try {
        const [prog, selectedOffering] = await Promise.all([
          getProgram(programId),
          getOffering(selectedOfferingId),
        ])
        setProgram(prog)
        const isRetiredLegacySelection = selectedOffering?.source === 'legacySession'
          && programUsesOfferings(prog)
        setOffering(
          selectedOffering?.programId === programId && !isRetiredLegacySelection
            ? selectedOffering
            : null
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [programId, selectedOfferingId])

  function set(field: string, value: any) {
    setFormState(prev => ({ ...prev, [field]: value }))
  }

  if (loading) return (
    <BookingLayout backTo={`/booking/${programId}`} backLabel="Back to Program">
      <div className="flex items-center justify-center h-48 text-slate-400">Loading…</div>
    </BookingLayout>
  )

  if (!program || !offering) return (
    <BookingLayout backTo="/booking" backLabel="All Programs">
      <div className="text-center py-20">
        <p className="text-slate-500 mb-4">This program schedule was not found or is no longer available.</p>
        <Link href="/booking" className="text-[#0c6162] font-semibold hover:underline">← Browse Programs</Link>
      </div>
    </BookingLayout>
  )

  const isRobotics = program.category === ROBOTICS_CATEGORY
  const selectedPackage = isRobotics && isValidPackageId(programId, packageIdParam) ? getRoboticsPackage(programId, packageIdParam) : null

  // The $10 demo registration is a completely separate product from the
  // Explorer/Builder/Engineer package flow — it never requires a package
  // selection, so it bypasses the "please choose a package first" guard
  // below entirely, and renders its own minimal 5-field form instead of the
  // multi-step package/payment-preference wizard.
  if (isDemoRegistration) {
    return <DemoRegisterForm programId={programId} program={program} offering={offering} />
  }

  // Robotics registrations are always package-based — never silently default
  // to a package if one wasn't actually chosen on the program page.
  if (isRobotics && !selectedPackage) return (
    <BookingLayout backTo={`/booking/${programId}`} backLabel="Back to Program">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
        <h1 className="text-xl font-black text-slate-800">Please choose a class package first</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Go back to the program page and choose Explorer, Builder, or Engineer before requesting a spot.
        </p>
        <Link href={`/booking/${programId}`} className="mt-5 inline-block text-sm font-semibold text-[#0c6162] hover:underline">
          ← Choose a Package
        </Link>
      </div>
    </BookingLayout>
  )

  if (!isOfferingRequestWindowOpen(offering)) return (
    <BookingLayout backTo={`/booking/${programId}`} backLabel="Back to Program">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
        <h1 className="text-xl font-black text-slate-800">Requests are not open for this schedule</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          View the program page for another weekly schedule, or contact us and we&apos;ll help you find the right option.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold">
          <Link href={`/booking/${programId}`} className="text-[#0c6162] hover:underline">View Program</Link>
          <Link href="/contact#consultation-form" className="text-[#0c6162] hover:underline">Contact Us</Link>
        </div>
      </div>
    </BookingLayout>
  )

  const soldOut = isOfferingSoldOut(offering)
  if (soldOut && !offering.waitlistEnabled) return (
    <BookingLayout backTo={`/booking/${programId}`} backLabel="Back to Program">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
        <h1 className="text-xl font-black text-slate-800">This weekly program is full</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          The waitlist is not open right now. Contact us and we&apos;ll help you explore another schedule or program.
        </p>
        <Link href="/contact#consultation-form" className="mt-5 inline-block text-sm font-semibold text-[#0c6162] hover:underline">
          Contact Us →
        </Link>
      </div>
    </BookingLayout>
  )
  const useWaitlist = isWaitlistParam || (soldOut && offering.waitlistEnabled)
  const price = Number(
    offering.tuitionCents
      || (program.isDepositOnly ? program.depositAmount : program.price)
      || 0
  )
  const discount = applyProgramDiscount(price, program)
  const priceLabel = price ? `$${(price / 100).toFixed(2)} ${offering.currency ?? 'CAD'}` : ''
  const discountedPriceLabel = discount.active ? `$${(discount.finalCents / 100).toFixed(2)} ${offering.currency ?? 'CAD'}` : ''
  const dateRange = formatOfferingDateRange(offering, selectedPackage)
  const packageSchedule = selectedPackage ? getPackageClassSchedule(offering, selectedPackage) : null
  const isBirthday = program.category === 'Birthday Party'

  // Payment preference is only meaningful for a real class-package commitment
  // that isn't a free waitlist join — waitlist requests never show or collect
  // a payment preference.
  const hasPaymentStep = Boolean(selectedPackage) && !useWaitlist
  const isRegularPackage = selectedPackage?.planType === 'rolling_monthly'
  // Regular and Builder/Engineer are billed monthly only — there is no
  // payment choice for a family to make. Explorer (legacy/internal, never
  // publicly listed) is the only package that still uses pay-in-full.
  const isMonthlyOnlyPackage = Boolean(selectedPackage?.paymentOptions?.recurringMonthlyEnabled)
  const effectiveMethod = isMonthlyOnlyPackage ? 'recurring_monthly' : paymentPreference.method
  const payInFullPricing = selectedPackage && !isMonthlyOnlyPackage ? resolvePackagePricing(selectedPackage, 'pay_in_full') : null
  // Real, schedule-derived monthly numbers — never a guessed/typical amount.
  // Builder/Engineer average the full path total across the offering's real
  // billing months; Regular estimates one specific month's classes.
  const learningPathTuition = selectedPackage && isMonthlyOnlyPackage && !isRegularPackage
    ? getLearningPathMonthlyTuition(offering, selectedPackage)
    : null
  const regularEstimate = selectedPackage && isRegularPackage
    ? getRegularMonthlyEstimate(offering, selectedPackage)
    : null

  const stepLabels = ['Your Info', 'Child Details', ...(hasPaymentStep ? ['Payment'] : []), 'Review & Submit']
  const paymentSubStep = hasPaymentStep ? 3 : -1
  const reviewSubStep = hasPaymentStep ? 4 : 3

  function goNext() {
    setError('')
    if (subStep === 1) {
      if (!form.parentName.trim()) { setError('Please enter your full name.'); return }
      if (!form.parentEmail.includes('@')) { setError('Please enter a valid email address.'); return }
      if (!form.parentPhone.trim()) { setError('Please enter your phone number.'); return }
    }
    if (subStep === 2) {
      if (!form.childName.trim()) { setError("Please enter your child's name."); return }
      if (!form.childAge) { setError("Please enter your child's age."); return }
    }
    setSubStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    setError('')
    setSubStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.consentAccepted) { setError('Please accept the consent to continue.'); return }
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/.netlify/functions/submit-enrollment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          ...(offering.source === 'legacySession'
            ? { sessionId: offering.id }
            : { offeringId: offering.id }),
          clientRequestId: clientRequestId.current,
          requestedAction: useWaitlist ? 'waitlist' : 'enrollment',
          ...(selectedPackage ? { packageId: selectedPackage.id } : {}),
          // Only the selected method is sent — every dollar amount is
          // resolved and validated server-side against the canonical
          // package catalogue, never trusted from the browser.
          ...(hasPaymentStep ? {
            paymentPreference: effectiveMethod === 'recurring_monthly'
              ? { method: 'recurring_monthly' }
              : { method: 'pay_in_full' },
          } : {}),
          registration: {
            parentName: form.parentName,
            parentEmail: form.parentEmail,
            parentPhone: form.parentPhone,
            childName: form.childName,
            childAge: form.childAge,
            childGrade: form.childGrade,
            medicalNotes: form.medicalNotes,
            emergencyContact: form.emergencyContact,
            specialRequests: form.specialRequests,
            consentAccepted: form.consentAccepted,
            photoConsent: form.photoConsent,
          },
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'We could not submit your request. Please try again.')

      if (useWaitlist) {
        const waitlistParams = new URLSearchParams()
        if (program?.title) waitlistParams.set('program', program.title)
        if (result.reference) waitlistParams.set('reference', result.reference)
        router.push(`/booking/waitlist-confirmed?${waitlistParams.toString()}`)
        return
      }

      const requestParams = new URLSearchParams()
      if (result.registrationNumber) requestParams.set('reference', result.registrationNumber)
      if (program?.title) requestParams.set('program', program.title)
      requestParams.set('programId', programId)
      // Carried through so the confirmation page can show the same itemized
      // class schedule the family just reviewed, without re-deriving it from
      // scratch or trying to serialize the whole schedule into the URL.
      if (offering?.source !== 'legacySession') requestParams.set('offeringId', offering.id)
      if (selectedPackage) requestParams.set('package', selectedPackage.id)
      router.push(`/booking/request-received?${requestParams.toString()}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <BookingLayout backTo={subStep === 1 ? `/booking/${programId}` : undefined} backLabel={program.title} maxWidth="max-w-xl">
      <BookingStepper step={2} />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0c6162, #0d9e9f)' }} />
        <div className="px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{useWaitlist ? 'Joining Waitlist' : 'Requesting a Spot'}</p>
            <h2 className="font-black text-slate-800">{program.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{offering.title} · {formatOfferingWeeklySchedule(offering)}</p>
            {dateRange && <p className="text-xs text-slate-400 mt-0.5">{dateRange}</p>}
          </div>
          {selectedPackage && !useWaitlist ? (
            <div className="shrink-0 text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-[#0083CB]">{selectedPackage.name}</p>
              {isRegularPackage ? (
                <>
                  <p className="text-xl font-black text-slate-800">${(selectedPackage.perClassCents / 100).toFixed(0)}/class</p>
                  <p className="text-xs text-slate-400">no long-term commitment</p>
                </>
              ) : isMonthlyOnlyPackage ? (
                <>
                  <p className="text-xl font-black text-slate-800">${(selectedPackage.perClassCents / 100).toFixed(0)}/class</p>
                  <p className="text-xs text-slate-400">{selectedPackage.classCount} classes · billed monthly</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-black text-slate-800">${(selectedPackage.regularSubtotalCents / 100).toFixed(0)}</p>
                  <p className="text-xs text-slate-400">{selectedPackage.classCount} classes · package price</p>
                </>
              )}
            </div>
          ) : price > 0 && !useWaitlist && (
            <div className="shrink-0 text-right">
              {discount.active ? (
                <>
                  <p className="text-xs text-slate-400 line-through">{priceLabel}</p>
                  <p className="text-xl font-black text-orange-600">{discountedPriceLabel}</p>
                  <p className="text-[10px] font-bold text-orange-600">🏷️ {discount.label}</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-black text-slate-800">{priceLabel}</p>
                  <p className="text-xs text-slate-400">listed price</p>
                </>
              )}
            </div>
          )}
          {useWaitlist && <span className="shrink-0 text-xs font-bold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">Waitlist</span>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <SubStepper step={subStep} steps={stepLabels} />
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm font-medium mb-5">{error}</div>
        )}

        {subStep === 1 && (
          <div className="space-y-4">
            <div className="mb-5">
              <h3 className="font-black text-slate-800 text-base">Your Information</h3>
              <p className="text-sm text-slate-400 mt-0.5">We&apos;ll send request updates to this email.</p>
            </div>
            <Field label="Full Name" required>
              <input required className={inputClass} value={form.parentName} onChange={e => set('parentName', e.target.value)} placeholder="Jane Smith" autoComplete="name" />
            </Field>
            <Field label="Email Address" required>
              <input required type="email" className={inputClass} value={form.parentEmail} onChange={e => set('parentEmail', e.target.value)} placeholder="jane@example.com" autoComplete="email" />
            </Field>
            <Field label="Phone Number" required>
              <input required type="tel" className={inputClass} value={form.parentPhone} onChange={e => set('parentPhone', e.target.value)} placeholder="(613) 555-0000" autoComplete="tel" />
            </Field>
            <Field label="Emergency Contact" hint="Name and phone number for emergencies">
              <input className={inputClass} value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} placeholder="John Smith — (613) 555-1234" />
            </Field>
            <button type="button" onClick={goNext} className="w-full mt-2 py-3.5 rounded-xl text-white font-black text-sm transition-all hover:opacity-90 active:scale-[0.99]" style={{ backgroundColor: '#0c6162' }}>
              Continue →
            </button>
          </div>
        )}

        {subStep === 2 && (
          <div className="space-y-4">
            <div className="mb-5">
              <h3 className="font-black text-slate-800 text-base">About Your Child</h3>
              <p className="text-sm text-slate-400 mt-0.5">Help us prepare the best experience.</p>
            </div>
            {isBirthday && (
              <div className="bg-pink-50 border border-pink-100 rounded-xl px-4 py-3 text-sm text-pink-700">
                After submitting, our team will contact you to finalize theme, guest count, and details.
              </div>
            )}
            <Field label="Child's Full Name" required>
              <input required className={inputClass} value={form.childName} onChange={e => set('childName', e.target.value)} placeholder="Alex Smith" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Age" required>
                <select required className={inputClass} value={form.childAge} onChange={e => set('childAge', e.target.value)}>
                  <option value="" disabled>Select age</option>
                  {AGE_OPTIONS.map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </Field>
              <Field label="Grade">
                <input className={inputClass} value={form.childGrade} onChange={e => set('childGrade', e.target.value)} placeholder="Grade 3" />
              </Field>
            </div>
            <Field label="Allergies / Medical Notes" hint="Anything we should know">
              <textarea rows={2} className={inputClass} value={form.medicalNotes} onChange={e => set('medicalNotes', e.target.value)} placeholder="e.g. peanut allergy, uses inhaler" />
            </Field>
            {isBirthday && (
              <Field label="Special Requests / Party Theme">
                <textarea rows={2} className={inputClass} value={form.specialRequests} onChange={e => set('specialRequests', e.target.value)} placeholder="e.g. Space theme, 15 kids, cake preferences…" />
              </Field>
            )}
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={goBack} className="flex-1 py-3.5 rounded-xl text-slate-600 font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-all">← Back</button>
              <button type="button" onClick={goNext} className="flex-1 py-3.5 rounded-xl text-white font-black text-sm transition-all hover:opacity-90 active:scale-[0.99]" style={{ backgroundColor: '#0c6162' }}>Continue →</button>
            </div>
          </div>
        )}

        {hasPaymentStep && isMonthlyOnlyPackage && subStep === paymentSubStep && (
          <div className="space-y-4">
            <div className="mb-5">
              <h3 className="font-black text-slate-800 text-base">Your monthly billing</h3>
              <p className="text-sm text-slate-400 mt-0.5">No payment is collected now.</p>
            </div>

            <div className="rounded-xl border border-[#0c6162] bg-[#0c6162]/5 p-4">
              <p className="font-bold text-slate-800 text-sm relative">
                Billed Monthly
                <MonthlyTuitionInfo />
              </p>
              {isRegularPackage ? (
                <>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    ${(selectedPackage.perClassCents / 100).toFixed(0)}/class <span className="font-normal text-slate-400">— billed for classes actually held</span>
                  </p>
                  {regularEstimate && regularEstimate.monthKey ? (
                    <p className="mt-1 text-sm text-slate-600">
                      ~${(regularEstimate.estimatedAmountCents / 100).toFixed(2)} estimated for {regularEstimate.monthLabel} ({regularEstimate.classesInMonth} class{regularEstimate.classesInMonth === 1 ? '' : 'es'})
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-600">Your first month&apos;s exact amount is confirmed after enrollment.</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    The amount varies month to month depending on the calendar. You may cancel before the next billing month.
                  </p>
                </>
              ) : learningPathTuition && learningPathTuition.billingMonthCount > 0 ? (
                <>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    ${(selectedPackage.perClassCents / 100).toFixed(0)}/class <span className="font-normal text-slate-400">— billed monthly for your {selectedPackage.classCount} classes</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    An invoice will be issued monthly based on your selected schedule (plus applicable taxes).
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-slate-600">Monthly tuition is calculated from your selected schedule.</p>
              )}
            </div>

            <div className="bg-[#e6f4f4] border border-[#0c6162]/15 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-[#0c6162]">No payment is due today.</p>
              <p className="text-sm text-slate-600 mt-1">This only records your billing preference for after your child&apos;s place is confirmed.</p>
            </div>

            <div className="flex gap-3 mt-2">
              <button type="button" onClick={goBack} className="flex-1 py-3.5 rounded-xl text-slate-600 font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-all">← Back</button>
              <button type="button" onClick={goNext} className="flex-1 py-3.5 rounded-xl text-white font-black text-sm transition-all hover:opacity-90 active:scale-[0.99]" style={{ backgroundColor: '#0c6162' }}>Continue →</button>
            </div>
          </div>
        )}

        {hasPaymentStep && !isMonthlyOnlyPackage && payInFullPricing && subStep === paymentSubStep && (
          <div className="space-y-4">
            <div className="mb-5">
              <h3 className="font-black text-slate-800 text-base">How would you like to pay?</h3>
              <p className="text-sm text-slate-400 mt-0.5">This sets your preference for after your child&apos;s place is confirmed — no payment is collected now.</p>
            </div>

            <div className="space-y-3">
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                paymentPreference.method === 'pay_in_full' ? 'border-[#0c6162] bg-[#0c6162]/5' : 'border-slate-200 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentPreference.method === 'pay_in_full'}
                  onChange={() => setPaymentPreference({ method: 'pay_in_full' })}
                  className="mt-0.5 accent-[#0c6162] w-4 h-4 shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 text-sm">Pay in Full</p>
                    {payInFullPricing.promotionApplied && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-orange-700">Best Price</span>
                    )}
                  </div>
                  {selectedPackage && (
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      ${(selectedPackage.perClassCents / 100).toFixed(0)}/class <span className="font-normal text-slate-400">when paid in full</span>
                    </p>
                  )}
                  <p className="mt-0.5 text-sm text-slate-600">
                    {payInFullPricing.promotionApplied ? (
                      <>
                        <span className="text-slate-400 line-through">${(payInFullPricing.regularSubtotalCents / 100).toFixed(2)}</span>{' '}
                        <span className="font-semibold text-orange-600">${(payInFullPricing.payableSubtotalCents / 100).toFixed(2)}</span> package subtotal
                      </>
                    ) : (
                      <>${(payInFullPricing.payableSubtotalCents / 100).toFixed(2)} package subtotal</>
                    )}
                  </p>
                  {payInFullPricing.promotionApplied && (
                    <p className="text-xs font-semibold text-orange-600">🏷️ Includes the Back-to-School first-class-free offer.</p>
                  )}
                  <p className="text-xs text-slate-400">Plus applicable taxes.</p>
                </div>
              </label>
            </div>

            <div className="bg-[#e6f4f4] border border-[#0c6162]/15 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-[#0c6162]">No payment is due today.</p>
              <p className="text-sm text-slate-600 mt-1">No payment is collected during this request. This only records your preference for after your child&apos;s place is confirmed.</p>
            </div>

            <div className="flex gap-3 mt-2">
              <button type="button" onClick={goBack} className="flex-1 py-3.5 rounded-xl text-slate-600 font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-all">← Back</button>
              <button type="button" onClick={goNext} className="flex-1 py-3.5 rounded-xl text-white font-black text-sm transition-all hover:opacity-90 active:scale-[0.99]" style={{ backgroundColor: '#0c6162' }}>Continue →</button>
            </div>
          </div>
        )}

        {subStep === reviewSubStep && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="mb-5">
              <h3 className="font-black text-slate-800 text-base">Review & Confirm</h3>
              <p className="text-sm text-slate-400 mt-0.5">Double-check your details before submitting your request.</p>
            </div>

            {selectedPackage && !useWaitlist && (
              <div className="rounded-xl border border-[#0083CB]/25 bg-[#0083CB]/5 px-4 py-3.5 text-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-[#0083CB]">Selected Package</p>
                <p className="mt-1 font-black text-slate-800">{selectedPackage.name}</p>
                {isRegularPackage ? (
                  <p className="font-semibold text-slate-800">${(selectedPackage.perClassCents / 100).toFixed(0)}/class — no long-term commitment</p>
                ) : isMonthlyOnlyPackage ? (
                  <>
                    <p className="mt-1 text-slate-600">{selectedPackage.classCount} classes</p>
                    <p className="font-semibold text-slate-800">${(selectedPackage.perClassCents / 100).toFixed(0)}/class — billed monthly</p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-slate-600">{selectedPackage.classCount} classes</p>
                    <p className="font-semibold text-slate-800">${(selectedPackage.regularSubtotalCents / 100).toFixed(0)} package price</p>
                  </>
                )}
                <p className="mt-1.5 text-xs font-semibold text-[#0c6162]">{getPaymentOptionsLabel(selectedPackage)}</p>
                <p className="mt-1 text-xs text-slate-400">Plus applicable taxes. Payment is not collected when requesting a spot. See your payment preference below for the total based on how you choose to pay.</p>
                {packageSchedule && packageSchedule.classDates.length > 0 && (
                  <div className="mt-3">
                    <ClassScheduleDisclosure schedule={packageSchedule} packageName={selectedPackage.name} />
                  </div>
                )}
              </div>
            )}

            {hasPaymentStep && isMonthlyOnlyPackage && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Payment Preference</p>
                {isRegularPackage ? (
                  <>
                    <p className="mt-1 font-semibold text-slate-800">
                      Billed Monthly — ${(selectedPackage.perClassCents / 100).toFixed(0)}/class for classes actually held
                    </p>
                    {regularEstimate && regularEstimate.monthKey ? (
                      <p className="text-slate-500">
                        ~${(regularEstimate.estimatedAmountCents / 100).toFixed(2)} estimated for {regularEstimate.monthLabel} ({regularEstimate.classesInMonth} class{regularEstimate.classesInMonth === 1 ? '' : 'es'})
                      </p>
                    ) : (
                      <p className="text-slate-500">Your first month&apos;s exact amount is confirmed after enrollment.</p>
                    )}
                  </>
                ) : learningPathTuition && learningPathTuition.billingMonthCount > 0 ? (
                  <>
                    <p className="mt-1 font-semibold text-slate-800">
                      Billed Monthly — ${(selectedPackage.perClassCents / 100).toFixed(0)}/class for your {selectedPackage.classCount} classes
                    </p>
                    <p className="text-slate-500">Invoiced monthly based on your selected schedule.</p>
                  </>
                ) : (
                  <p className="mt-1 font-semibold text-slate-800">Monthly tuition is calculated from your selected schedule.</p>
                )}
                <p className="mt-1 text-xs text-slate-400">No payment is due today.</p>
              </div>
            )}

            {hasPaymentStep && !isMonthlyOnlyPackage && payInFullPricing && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Payment Preference</p>
                <p className="mt-1 font-semibold text-slate-800">
                  Pay in Full — ${(payInFullPricing.payableSubtotalCents / 100).toFixed(2)} (plus applicable taxes)
                </p>
                <p className={`text-xs font-semibold ${payInFullPricing.promotionApplied ? 'text-orange-600' : 'text-slate-400'}`}>
                  {payInFullPricing.promotionApplied
                    ? `${PACKAGE_PROMO.label} applied — save $${(payInFullPricing.promotionDiscountCents / 100).toFixed(2)}`
                    : 'No promotion applied.'}
                </p>
                <p className="mt-1 text-xs text-slate-400">No payment is due today.</p>
                <button type="button" onClick={() => setSubStep(paymentSubStep)} className="mt-2 text-xs font-semibold text-[#0c6162] hover:underline">Change payment preference</button>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl divide-y divide-slate-100 text-sm">
              {[
                { label: 'Parent', value: form.parentName },
                { label: 'Email', value: form.parentEmail },
                { label: 'Phone', value: form.parentPhone },
                { label: 'Child', value: form.childName },
                { label: 'Age / Grade', value: [form.childAge && `Age ${form.childAge}`, form.childGrade].filter(Boolean).join(' · ') || null },
                form.medicalNotes ? { label: 'Medical Notes', value: form.medicalNotes } : null,
                form.emergencyContact ? { label: 'Emergency', value: form.emergencyContact } : null,
              ].filter((row): row is { label: string; value: string } => !!(row && row.value)).map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
                  <span className="text-slate-400 shrink-0">{label}</span>
                  <span className="font-semibold text-slate-700 text-right">{value}</span>
                </div>
              ))}
            </div>
            <button type="button" onClick={goBack} className="text-sm font-semibold text-slate-400 hover:text-[#0c6162] transition-colors">← Edit details</button>

            {!useWaitlist && (
              <div className="bg-[#e6f4f4] border border-[#0c6162]/15 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-[#0c6162]">No payment is due today.</p>
                <p className="text-sm text-slate-600 mt-1">
                  This form requests a place; it does not confirm enrollment. We will review availability and contact you with placement and payment details.
                </p>
              </div>
            )}

            {useWaitlist && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-orange-700 font-medium">
                This weekly program is full. Joining the waitlist is free — you&apos;ll be emailed if a spot opens.
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required checked={form.consentAccepted} onChange={e => set('consentAccepted', e.target.checked)} className="mt-0.5 accent-[#0c6162] w-4 h-4 shrink-0" />
                <span className="text-sm text-slate-600">
                  I confirm this information is accurate and consent to Kriana using it to review this request and contact me. I understand this request does not confirm a seat. <span className="text-red-500">*</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.photoConsent} onChange={e => set('photoConsent', e.target.checked)} className="mt-0.5 accent-[#0c6162] w-4 h-4 shrink-0" />
                <span className="text-sm text-slate-500">I consent to photos/videos being used for Kriana promotional materials. (Optional)</span>
              </label>
            </div>

            <button type="submit" disabled={submitting} className="w-full py-4 rounded-xl text-white font-black text-base transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm" style={{ backgroundColor: '#0c6162' }}>
              {submitting ? 'Submitting…' : useWaitlist ? 'Join Waitlist' : 'Submit Registration Request →'}
            </button>
            <p className="text-center text-xs text-slate-400">Your information is kept private and used only for program administration.</p>
          </form>
        )}
      </div>
    </BookingLayout>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-400">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  )
}
