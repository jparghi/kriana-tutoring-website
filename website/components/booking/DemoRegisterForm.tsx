'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { eventTerms } from '../../lib/demo-event-copy.js'
import { formatEventDateTime, formatEventTimeRange } from '../../lib/booking'
import { trackEvent, ALLOWED_ATTRIBUTION_PARAMS } from '../../lib/analytics'
import { trackMetaCompleteRegistration } from '../../lib/meta-pixel'
import { getDemoPricing } from '../../lib/robotics-packages.js'
import { CARD_PAYMENTS_ENABLED, ETRANSFER_OFFERED } from '../../lib/payment-options'
import { REFUND_POLICY_SHORT } from '../../lib/refund-policy'
import BookingLayout from './BookingLayout'
import { BookingStepper } from './BookingStepper'

export function Field({ label, children, required, hint }: { label: string; children: React.ReactNode; required?: boolean; hint?: string }) {
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

export const inputClass = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0c6162]/30 focus:border-[#0c6162] transition-all bg-white'

// Pay-first e-Transfer: the family sends the money while on the form and
// enters the Interac reference their bank shows, which is required before
// Register (see submit-demo-registration.js, same pattern).
const ETRANSFER_EMAIL = process.env.NEXT_PUBLIC_ETRANSFER_EMAIL || 'info@krianatutoring.com'
const ETRANSFER_REFERENCE_PATTERN = /^[A-Za-z0-9-]{4,40}$/


function newClientRequestId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `demo-request-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function normalizeEtransferReference(value: string) {
  return value.replace(/\s+/g, '')
}

function CopyLine({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#0c6162]/10 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
        <p className={`text-sm font-semibold text-slate-800 break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className={`shrink-0 text-xs font-bold px-3 py-2 min-h-[40px] rounded-lg transition-all active:scale-95 ${copied ? 'bg-green-100 text-green-700' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

// ─── Young Engineers Demo Registration ─────────────────────────────────────
//
// Intentionally minimal — a 5-field form (parentName, parentEmail,
// parentPhone, childName, childAge) plus required consent, and for workshops
// an optional allergies/accommodations note (kids stay for hours). No medicalNotes,
// emergencyContact, specialRequests, childGrade, or photoConsent — those
// belong to the separate request_only enrollment form and are not part of
// this product's spec. This component only renders when the program page's
// demo CTA linked here (which itself only appears when
// NEXT_PUBLIC_ENABLE_DEMO_PAYMENTS === 'true' and a published demo offering
// exists). Price is per-offering (offering.tuitionCents, set by staff in the
// portal — see getDemoPricing), not a fixed amount.
//
// mode 'waitlist' is the same form, shown on the same register link when the
// demo is fully booked (or public booking is paused) and the offering's
// waitlistEnabled switch is on. It posts to submit-demo-waitlist.js, which
// never holds a seat, creates a demo credit, or requests payment — so this
// mode drops every price / e-transfer / "hold your spot" line.
// Parent details saved on Register so "Register another child" (on the
// confirmation page) can reopen the form with them filled in. Same browser
// only; never sent anywhere.
export const LAST_EVENT_PARENT_KEY = 'kt-last-event-parent'
export interface LastEventParent { parentName: string; parentEmail: string; parentPhone: string; offeringId: string }

export function readLastEventParent(): LastEventParent | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(LAST_EVENT_PARENT_KEY) || 'null')
    return value && typeof value.parentEmail === 'string' ? value : null
  } catch { return null }
}

// `embedded`: rendered inline on /events (QuickBook), which shows its own
// session summary — so no page layout, stepper or event header here.
export function DemoRegisterForm({ programId, program, offering, mode = 'register', embedded = false, prefill }: {
  programId: string; program: any; offering: any; mode?: 'register' | 'waitlist'; embedded?: boolean
  prefill?: { parentName: string; parentEmail: string; parentPhone: string } | null
}) {
  const isWaitlist = mode === 'waitlist'
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientRequestId = useRef('')
  // Display-only — the server independently resolves the same value from
  // the offering doc and never trusts anything the browser sends.
  const pricing = getDemoPricing(offering)
  const { priceCents, currency } = pricing
  // Wording follows the offering's eventType (demo vs workshop).
  const terms = eventTerms(offering?.eventType)
  const priceLabel = `$${(priceCents / 100).toFixed(2)} ${currency}`
  // Headings use the before-tax price ("$25.00 Workshop"); the price box and
  // e-transfer amount use priceLabel, which includes any HST.
  const priceDisplay = `$${(pricing.subtotalCents / 100).toFixed(2)}`
  const earlyBirdUntil = pricing.earlyBirdEndsAt
    ? new Date(new Date(pricing.earlyBirdEndsAt).getTime() - 1).toLocaleDateString('en-CA', { timeZone: 'America/Toronto', month: 'short', day: 'numeric' })
    : null
  const creditEnabled = offering?.demoCreditEnabled !== false
  const [form, setFormState] = useState({
    parentName: prefill?.parentName ?? '', parentEmail: prefill?.parentEmail ?? '', parentPhone: prefill?.parentPhone ?? '',
    childName: '', childAge: '', accommodations: '', etransferReference: '', consentAccepted: false,
    // Required Yes/No, nothing pre-selected: a pre-ticked box isn't real consent.
    photoConsent: '' as '' | 'YES' | 'NO',
  })
  const askAccommodations = !isWaitlist && terms.kind === 'workshop'
  // Free offerings have nothing to send, so no e-Transfer step.
  const payFirst = !isWaitlist && priceCents > 0
  const cardAvailable = payFirst && CARD_PAYMENTS_ENABLED
  const [payMethod, setPayMethod] = useState<'card' | 'etransfer'>(CARD_PAYMENTS_ENABLED ? 'card' : 'etransfer')
  // With e-Transfer hidden, card is the only choice (no radio shown).
  const payByCard = cardAvailable && (!ETRANSFER_OFFERED || payMethod === 'card')
  // Only the e-Transfer path needs the Interac reference before Register.
  const needsReference = payFirst && !payByCard
  // Set when the parent came back from Stripe without paying.
  const [paymentCancelledNotice, setPaymentCancelledNotice] = useState(false)
  const etransferReference = normalizeEtransferReference(form.etransferReference)
  const referenceValid = ETRANSFER_REFERENCE_PATTERN.test(etransferReference)
  // The booking number doesn't exist until Register, so the note identifies
  // the child and event instead; staff match on the Interac reference.
  const etransferNote = `${form.childName.trim() || "Child's name"} - ${offering.eventTitle || program.title}`
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!clientRequestId.current) {
      clientRequestId.current = newClientRequestId()
    }
    // Back from Stripe Checkout without paying: release that unpaid
    // registration now (seat + the child's one-per-event lock), so they can
    // register again straight away. A no-op if it was paid or already released.
    const cancelledPayment = searchParams.get('cancelledPayment')
    if (cancelledPayment && !isWaitlist) {
      setPaymentCancelledNotice(true)
      fetch('/.netlify/functions/cancel-demo-payment-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoRegistrationId: cancelledPayment }),
      }).catch(() => {})
    }
    trackEvent(isWaitlist ? 'demo_waitlist_started' : 'demo_registration_started', { offeringId: offering?.id ?? null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reads the same allowlisted params /events appended to this page's CTA
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
      landingPath: hasAnyParam ? '/events' : null,
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
    if (!isWaitlist && !form.photoConsent) { setError('Please answer the photo consent question.'); return }
    if (!form.consentAccepted) { setError('Please accept the consent to continue.'); return }
    if (needsReference && !referenceValid) {
      setError('Please send your e-Transfer and enter its Interac reference number (letters and numbers, as shown by your bank).')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const registerResponse = await fetch(isWaitlist ? '/.netlify/functions/submit-demo-waitlist' : '/.netlify/functions/submit-demo-registration', {
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
            ...(askAccommodations && form.accommodations.trim() ? { accommodations: form.accommodations } : {}),
            ...(needsReference ? { etransferReference } : {}),
            ...(!isWaitlist && form.photoConsent ? { photoConsent: form.photoConsent } : {}),
            consentAccepted: form.consentAccepted,
          },
          ...(payFirst ? { paymentMethod: payByCard ? 'card' : 'etransfer' } : {}),
          marketingAttribution: buildAttribution(),
        }),
      })
      const registerResult = await registerResponse.json().catch(() => ({}))
      if (!registerResponse.ok) {
        const message = registerResult.error || (isWaitlist
          ? 'We could not add you to the waitlist. Please try again.'
          : 'We could not submit your registration. Please try again.')
        // They may have already paid: a full/closed session must never leave
        // them wondering about their money.
        throw new Error(needsReference && registerResponse.status === 409
          ? `${message} If you already sent your e-Transfer, call or text 613-400-6921 and we'll refund it in full.`
          : message)
      }

      if (isWaitlist) {
        trackEvent('demo_waitlist_submitted', { offeringId: offering?.id ?? null })
        const waitlistParams = new URLSearchParams({ type: 'demo', program: offering.eventTitle || program.title })
        if (registerResult.reference) waitlistParams.set('reference', registerResult.reference)
        router.push(`/booking/waitlist-confirmed?${waitlistParams.toString()}`)
        return
      }

      trackEvent('demo_registration_submitted', { offeringId: offering?.id ?? null })
      try {
        const saved: LastEventParent = { parentName: form.parentName, parentEmail: form.parentEmail, parentPhone: form.parentPhone, offeringId: offering.id }
        window.localStorage.setItem(LAST_EVENT_PARENT_KEY, JSON.stringify(saved))
      } catch { /* convenience only */ }
      // The server has saved the registration (response.ok above) — this is
      // the Meta ad conversion. Payment is still pending verification.
      trackMetaCompleteRegistration(registerResult.demoRegistrationId ?? registerResult.registrationNumber ?? null)

      if (payByCard && registerResult.demoRegistrationId) {
        // Saved unpaid; now open Stripe Checkout. The seat is held while
        // they pay, and released if they leave without paying.
        const sessionResponse = await fetch('/.netlify/functions/create-demo-payment-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demoRegistrationId: registerResult.demoRegistrationId }),
        })
        const sessionResult = await sessionResponse.json().catch(() => ({}))
        if (sessionResponse.ok && sessionResult.url) {
          window.location.assign(sessionResult.url)
          return
        }
        // Couldn't open the payment page: release the unpaid registration so
        // nothing stays held, and start a fresh request id for the retry.
        await fetch('/.netlify/functions/cancel-demo-payment-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demoRegistrationId: registerResult.demoRegistrationId }),
        }).catch(() => {})
        clientRequestId.current = newClientRequestId()
        throw new Error(sessionResult.error
          ? `${sessionResult.error} Nothing was charged.`
          : (ETRANSFER_OFFERED
            ? 'We couldn’t open the card payment page. Nothing was charged. Please try again, or pay by Interac e-Transfer.'
            : 'We couldn’t open the card payment page. Nothing was charged. Please try again, or call or text 613-400-6921.'))
      }

      // e-Transfer (or free) — send the family to
      // the instructions page with everything it needs already in hand, no
      // extra fetch (and no Firestore read, which demoRegistrations doesn't
      // allow client-side per firestore.rules).
      const params = new URLSearchParams({
        reference: registerResult.registrationNumber ?? '',
        demoRegistrationId: registerResult.demoRegistrationId ?? '',
        programId,
        program: program.title,
        eventTitle: offering.eventTitle ?? '',
        eventType: offering.eventType ?? '',
        eventDate: formatEventDateTime(offering),
        eventTime: formatEventTimeRange(offering),
        eventLocation: offering.location ?? '',
        // The amount the server actually recorded (it re-prices at submit,
        // e.g. across the early-bird cutoff); the local value is a fallback.
        amountCents: String(registerResult.amountCents ?? priceCents),
        currency: registerResult.currency ?? currency,
        credit: creditEnabled ? '1' : '0',
        eventStartAt: offering.eventStartAt ?? '',
        eventEndAt: offering.eventEndAt ?? '',
      })
      // Present → the page shows "registration received, verifying payment"
      // instead of asking them to send an e-Transfer they already sent.
      if (needsReference) params.set('etransferReference', etransferReference)
      router.push(`/booking/demo-etransfer?${params.toString()}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const formElement = (
      <form onSubmit={handleSubmit} className={embedded ? 'space-y-4' : 'bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4'}>
        {isWaitlist ? (
          <>
            <div className="mb-1">
              <h3 className="font-black text-slate-800 text-base">Join the Waitlist</h3>
              <p className="text-sm text-slate-400 mt-0.5">{terms.thisEvent} is fully booked. Leave your details and we&apos;ll contact you if a spot opens up.</p>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
              <p className="text-sm font-bold text-sky-800">Free to join — no payment is due.</p>
              <p className="text-sm text-sky-800 mt-1">Joining doesn&apos;t reserve a spot. Families on the waitlist will be the first to hear about our next {terms.kind === 'workshop' ? 'event' : 'demo'}.</p>
            </div>
          </>
        ) : (
          <>
            {!embedded && (
              <div className="mb-1">
                <h3 className="font-black text-slate-800 text-base">{terms.registerHeading(priceDisplay)}</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  {payFirst && cardAvailable
                    ? (ETRANSFER_OFFERED
                      ? <>Fill in your details, then pay {priceLabel} by card or Interac e-Transfer.</>
                      : <>Fill in your details, then pay {priceLabel} securely by card.</>)
                    : payFirst
                    ? <>Fill in your details, send the {priceLabel} e-Transfer, then enter its reference number to register.</>
                    : <>Just a few details to hold your child&apos;s {terms.spot}.</>}
                </p>
              </div>
            )}

            {creditEnabled && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-bold text-amber-700">{terms.creditHeadline(priceDisplay)}</p>
                <p className="text-sm text-amber-700 mt-1">The {priceDisplay} is credited toward regular enrollment after your child attends.</p>
              </div>
            )}
          </>
        )}

        {paymentCancelledNotice && !error && (
          <div className="bg-sky-50 border border-sky-200 text-sky-800 rounded-xl px-4 py-3 text-sm font-medium">
            Your card payment wasn&apos;t completed, so nothing was charged and the spot was released. You can register again below.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">{error}</div>
        )}

        {!isWaitlist && (
          <p className="text-sm text-slate-600"><strong className="text-slate-800">Registering siblings?</strong> Complete one registration per child.</p>
        )}

        {/* Child first: on "Register another child" the parent fields below
            are already filled in, so the parent starts at the empty ones. */}
        <Field label="Child's Full Name" required>
          <input required name="child-name" className={inputClass} value={form.childName} onChange={e => set('childName', e.target.value)} placeholder="Alex Smith" autoComplete="off" />
        </Field>
        <Field label="Child's Age" required>
          <input required type="number" inputMode="numeric" min={1} max={18} name="child-age" className={inputClass} value={form.childAge} onChange={e => set('childAge', e.target.value)} placeholder="8" autoComplete="off" />
        </Field>
        {askAccommodations && (
          <Field label="Allergies or accommodations" hint="Optional. Only what our instructors need to know to keep your child safe.">
            <textarea rows={2} maxLength={500} className={inputClass} value={form.accommodations} onChange={e => set('accommodations', e.target.value)} placeholder="e.g. peanut allergy" />
          </Field>
        )}
        <h4 className="pt-2 font-black text-slate-800 text-sm">Parent or guardian</h4>
        <Field label="Parent or Guardian's Full Name" required>
          <input required name="name" className={inputClass} value={form.parentName} onChange={e => set('parentName', e.target.value)} placeholder="Jane Smith" autoComplete="name" />
        </Field>
        <Field label="Email Address" required>
          <input required type="email" inputMode="email" name="email" className={inputClass} value={form.parentEmail} onChange={e => set('parentEmail', e.target.value)} placeholder="jane@example.com" autoComplete="email" />
        </Field>
        <Field label="Phone Number" required>
          <input required type="tel" inputMode="tel" name="tel" className={inputClass} value={form.parentPhone} onChange={e => set('parentPhone', e.target.value)} placeholder="(613) 555-0000" autoComplete="tel" />
        </Field>

        {!isWaitlist && (
          <fieldset className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
            <legend className="sr-only">Photo consent</legend>
            <p className="text-sm font-semibold text-slate-700">Photo consent <span className="text-red-500">*</span></p>
            <p className="text-xs text-slate-500 mt-0.5">We sometimes share {terms.noun} photos and videos on our website and social media.</p>
            <div className="mt-2 grid gap-2">
              {([
                { value: 'YES', label: 'Yes, you may use photos/videos of my child' },
                { value: 'NO', label: 'No photos of my child, please' },
              ] as const).map(option => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-all ${form.photoConsent === option.value ? 'border-[#0c6162] ring-2 ring-[#0c6162]/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <input
                    type="radio"
                    name="photo-consent"
                    value={option.value}
                    required
                    checked={form.photoConsent === option.value}
                    onChange={() => set('photoConsent', option.value)}
                    className="h-4 w-4 shrink-0 accent-[#0c6162]"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {cardAvailable && ETRANSFER_OFFERED && (
          <div className="pt-2">
            <h4 className="font-black text-slate-800 text-sm">How would you like to pay {priceLabel}?</h4>
            <div className="mt-2 grid gap-2" role="radiogroup" aria-label="Payment method">
              {([
                { value: 'card', title: 'Pay by card', detail: 'Visa, Mastercard, Amex, Apple Pay or Google Pay. Booked instantly.' },
                { value: 'etransfer', title: 'Interac e-Transfer', detail: 'Send from your bank, then enter the reference number.' },
              ] as const).map(option => {
                const selected = payMethod === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => { setPayMethod(option.value); setError('') }}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all ${selected ? 'border-[#0c6162] bg-[#e6f4f4] ring-2 ring-[#0c6162]/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${selected ? 'border-[#0c6162] bg-[#0c6162] shadow-[inset_0_0_0_2px_white]' : 'border-slate-300'}`} aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-bold text-slate-800">{option.title}</span>
                      <span className="block text-xs text-slate-500 mt-0.5">{option.detail}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {payByCard && (
          <div className="rounded-xl border border-[#0c6162]/20 bg-[#e6f4f4] px-4 py-3">
            <p className="text-sm font-bold text-[#0c6162]">Secure card payment by Stripe</p>
            <p className="text-sm text-slate-600 mt-1">After you press Register, you&apos;ll pay {priceLabel} with Apple Pay, Google Pay or card on Stripe&apos;s secure page. Your spot is held for 30 minutes while you pay, and nothing is charged until you confirm there.</p>
          </div>
        )}

        {needsReference && (
          <>
            <div className="pt-2">
              <h4 className="font-black text-slate-800 text-sm">Send your {priceLabel} e-Transfer</h4>
              <p className="text-sm text-slate-500 mt-0.5">Open your banking app and send an Interac e-Transfer with these details. Keep this page open; your details above stay filled in.</p>
            </div>
            <div className="bg-[#e6f4f4] rounded-xl border border-[#0c6162]/20 px-4">
              <CopyLine label="Send to" value={ETRANSFER_EMAIL} mono />
              <CopyLine label="Amount" value={priceLabel} />
              <CopyLine label="Message / Note" value={etransferNote} />
            </div>

            <Field
              label="Interac e-Transfer reference number"
              required
              hint="Your bank shows it right after you send, and in its confirmation email (e.g. CA7mQx2T)."
            >
              <input
                required
                className={`${inputClass} font-mono`}
                value={form.etransferReference}
                onChange={e => set('etransferReference', e.target.value)}
                placeholder="e.g. CA7mQx2T"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={60}
              />
            </Field>
          </>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" required checked={form.consentAccepted} onChange={e => set('consentAccepted', e.target.checked)} className="mt-0.5 accent-[#0c6162] w-4 h-4 shrink-0" />
          <span className="text-sm text-slate-600">
            {isWaitlist
              ? <>I confirm this information is accurate and consent to Kriana using it to add my child to the waitlist for {offering.eventTitle || `this ${terms.noun}`} and contact me about the waitlist and future {terms.kind === 'workshop' ? 'events' : 'demos'}.</>
              : <>I confirm this information is accurate and consent to Kriana using it to register my child for {offering.eventTitle || `this ${priceDisplay} ${terms.noun}`} and contact me about this registration.</>}
            {' '}<span className="text-red-500">*</span>
          </span>
        </label>

        <button type="submit" disabled={submitting || (needsReference && !referenceValid)} className="w-full py-4 rounded-xl text-white font-black text-base transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm" style={{ backgroundColor: '#F2A100' }}>
          {submitting
            ? (payByCard ? 'Opening secure payment…' : 'Submitting…')
            : isWaitlist ? 'Join the Waitlist' : payByCard ? `Register & Pay ${priceLabel}` : payFirst ? 'Register' : 'Register & Get E-Transfer Instructions →'}
        </button>
        {payFirst && (
          <p className="text-center text-xs font-semibold text-slate-600">{REFUND_POLICY_SHORT}</p>
        )}
        <p className="text-center text-xs text-slate-400">
          {isWaitlist
            ? 'You’ll get an email confirming you’re on the waitlist.'
            : payByCard
              ? 'You’ll pay on Stripe’s secure page. If you leave without paying, nothing is charged.'
            : payFirst
              ? (referenceValid
                ? 'We’ll match your e-Transfer and confirm your spot by email. If the session fills before you register, we’ll refund your e-Transfer in full.'
                : 'Send the e-Transfer and enter its reference number to register.')
              : <>You&apos;ll receive instructions to send your {priceLabel} payment by e-transfer.</>}
        </p>
      </form>
  )
  if (embedded) return formElement

  return (
    <BookingLayout backTo={`/booking/${programId}`} backLabel={program.title} maxWidth="max-w-xl">
      <BookingStepper step={2} />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #F2A100, #ED174B)' }} />
        <div className="px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{isWaitlist ? terms.waitlistLabel : terms.priceTag(priceDisplay)}</p>
            <h2 className="font-black text-slate-800">{offering.eventTitle || program.title}</h2>
            {/* This campaign's demo has a fixed date/time/location (set on
                the offering doc by an admin) — never say "we'll follow up
                to schedule," which is wrong once an offering carries a
                fixed event. Falls back to a generic line if the offering
                doesn't carry event fields. */}
            <p className="text-sm text-slate-500 mt-0.5">
              {formatEventDateTime(offering)
                ? `${formatEventDateTime(offering)}${offering.location ? ` · ${offering.location}` : ''}`
                : `Our team will follow up to confirm your child's ${terms.noun} details.`}
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
          {isWaitlist ? (
            <span className="shrink-0 text-xs font-bold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">Fully booked</span>
          ) : (
            <div className="shrink-0 text-right">
              <p className="text-xl font-black text-slate-800">{priceLabel}</p>
              {pricing.taxCents > 0 && (
                <p className="text-xs text-slate-500">{priceDisplay} + ${(pricing.taxCents / 100).toFixed(2)} HST</p>
              )}
              {earlyBirdUntil ? (
                <p className="text-xs font-bold text-[#ED174B]">Early bird until {earlyBirdUntil} (regular ${(pricing.regularSubtotalCents / 100).toFixed(0)} + tax)</p>
              ) : (
                <p className="text-xs text-slate-400">{terms.oneTimeCharge}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {formElement}
    </BookingLayout>
  )
}
