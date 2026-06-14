'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getProgram, getSession, getAvailableSeats, formatDateTime,
  createRegistration, updateRegistration, addToWaitlist,
  PAYMENT_METHOD, REGISTRATION_STATUS, SESSION_STATUS,
} from '../../../../lib/booking'
import BookingLayout from '../../../../components/booking/BookingLayout'
import { BookingStepper } from '../../../../components/booking/BookingStepper'

const ETRANSFER_EMAIL = process.env.NEXT_PUBLIC_ETRANSFER_EMAIL || 'info@krianatutoring.com'

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

async function sendConfirmationEmail(registrationId: string, type: string) {
  try {
    await fetch('/.netlify/functions/send-booking-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId, type }),
    })
  } catch {
    // non-blocking
  }
}

function SubStepper({ step }: { step: number }) {
  const steps = ['Your Info', 'Child Details', 'Review & Pay']
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
  const sessionId = searchParams.get('sessionId') ?? ''
  const isWaitlistParam = searchParams.get('waitlist') === '1'
  const router = useRouter()

  const [program, setProgram] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [subStep, setSubStep] = useState(1)

  const [form, setFormState] = useState({
    parentName: '', parentEmail: '', parentPhone: '', childName: '',
    childAge: '', childGrade: '', medicalNotes: '', emergencyContact: '',
    specialRequests: '', consentAccepted: false, photoConsent: false,
    paymentMethod: PAYMENT_METHOD.ETRANSFER,
  })

  useEffect(() => {
    async function load() {
      if (!sessionId) { setLoading(false); return }
      try {
        const [prog, sess] = await Promise.all([getProgram(programId), getSession(sessionId)])
        setProgram(prog)
        setSession(sess)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [programId, sessionId])

  function set(field: string, value: any) {
    setFormState(prev => ({ ...prev, [field]: value }))
  }

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
      const soldOut = session && getAvailableSeats(session) === 0
      const useWaitlist = isWaitlistParam || (soldOut && session?.waitlistEnabled)

      if (useWaitlist) {
        await addToWaitlist({
          programId, sessionId,
          parentName: form.parentName, parentEmail: form.parentEmail, parentPhone: form.parentPhone,
          childName: form.childName, childAge: form.childAge, childGrade: form.childGrade,
          medicalNotes: form.medicalNotes, emergencyContact: form.emergencyContact,
          specialRequests: form.specialRequests, consentAccepted: form.consentAccepted,
          photoConsent: form.photoConsent,
        })
        router.push(`/booking/waitlist-confirmed?program=${encodeURIComponent(program?.title ?? '')}`)
        return
      }

      const amountCents = program?.isDepositOnly ? program.depositAmount : program?.price
      const registrationId = await createRegistration({
        programId, sessionId,
        parentName: form.parentName, parentEmail: form.parentEmail, parentPhone: form.parentPhone,
        childName: form.childName, childAge: form.childAge, childGrade: form.childGrade,
        medicalNotes: form.medicalNotes, emergencyContact: form.emergencyContact,
        specialRequests: form.specialRequests, consentAccepted: form.consentAccepted,
        photoConsent: form.photoConsent, paymentMethod: form.paymentMethod,
        amountDue: amountCents, amountPaid: 0, isDepositOnly: program?.isDepositOnly ?? false,
      })

      if (form.paymentMethod === PAYMENT_METHOD.ETRANSFER) {
        await updateRegistration(registrationId, { registrationStatus: REGISTRATION_STATUS.PENDING_PAYMENT })
        sendConfirmationEmail(registrationId, 'pending')
        router.push(`/booking/etransfer/${registrationId}`)
        return
      }

      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId, sessionId,
          programTitle: program?.title ?? '', sessionTitle: session?.title ?? '',
          amountCents, parentEmail: form.parentEmail, parentName: form.parentName,
          childName: form.childName, isDepositOnly: program?.isDepositOnly ?? false,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session')
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) return (
    <BookingLayout backTo={`/booking/${programId}`} backLabel="Back to Program">
      <div className="flex items-center justify-center h-48 text-slate-400">Loading…</div>
    </BookingLayout>
  )

  if (!program || !session) return (
    <BookingLayout backTo="/booking" backLabel="All Programs">
      <div className="text-center py-20">
        <p className="text-slate-500 mb-4">Session not found or no longer available.</p>
        <Link href="/booking" className="text-[#0c6162] font-semibold hover:underline">← Browse Programs</Link>
      </div>
    </BookingLayout>
  )

  const available = getAvailableSeats(session)
  const soldOut = available === 0
  const useWaitlist = isWaitlistParam || (soldOut && session.waitlistEnabled)
  const price = program.isDepositOnly ? program.depositAmount : program.price
  const priceLabel = price ? `$${(price / 100).toFixed(2)} CAD${program.isDepositOnly ? ' deposit' : ''}` : 'Free'
  const isBirthday = program.category === 'Birthday Party'

  return (
    <BookingLayout backTo={subStep === 1 ? `/booking/${programId}` : undefined} backLabel={program.title} maxWidth="max-w-xl">
      <BookingStepper step={2} />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0c6162, #0d9e9f)' }} />
        <div className="px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{useWaitlist ? 'Joining Waitlist' : 'Booking'}</p>
            <h2 className="font-black text-slate-800">{program.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{session.title} · {formatDateTime(session.startDateTime)}</p>
          </div>
          {price > 0 && !useWaitlist && (
            <div className="shrink-0 text-right">
              <p className="text-xl font-black text-slate-800">{priceLabel}</p>
              {program.isDepositOnly && <p className="text-xs text-slate-400">deposit</p>}
            </div>
          )}
          {useWaitlist && <span className="shrink-0 text-xs font-bold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">Waitlist</span>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <SubStepper step={subStep} />
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm font-medium mb-5">{error}</div>
        )}

        {subStep === 1 && (
          <div className="space-y-4">
            <div className="mb-5">
              <h3 className="font-black text-slate-800 text-base">Your Information</h3>
              <p className="text-sm text-slate-400 mt-0.5">We&apos;ll send booking details to this email.</p>
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
                <input required type="number" min={1} max={18} className={inputClass} value={form.childAge} onChange={e => set('childAge', e.target.value)} placeholder="8" />
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

        {subStep === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="mb-5">
              <h3 className="font-black text-slate-800 text-base">Review & Confirm</h3>
              <p className="text-sm text-slate-400 mt-0.5">Double-check your details before submitting.</p>
            </div>
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

            {!useWaitlist && price > 0 && (
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3">How would you like to pay?</h4>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${form.paymentMethod === PAYMENT_METHOD.ETRANSFER ? 'border-[#0c6162] bg-[#e6f4f4]' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="paymentMethod" value={PAYMENT_METHOD.ETRANSFER} checked={form.paymentMethod === PAYMENT_METHOD.ETRANSFER} onChange={() => set('paymentMethod', PAYMENT_METHOD.ETRANSFER)} className="mt-0.5 accent-[#0c6162]" />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Interac E-Transfer</p>
                      <p className="text-xs text-slate-500 mt-0.5">Send to <span className="font-mono font-semibold">{ETRANSFER_EMAIL}</span>. Spot held 24 hours.</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${form.paymentMethod === PAYMENT_METHOD.STRIPE ? 'border-[#0c6162] bg-[#e6f4f4]' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="paymentMethod" value={PAYMENT_METHOD.STRIPE} checked={form.paymentMethod === PAYMENT_METHOD.STRIPE} onChange={() => set('paymentMethod', PAYMENT_METHOD.STRIPE)} className="mt-0.5 accent-[#0c6162]" />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Pay Online — Credit / Debit</p>
                      <p className="text-xs text-slate-500 mt-0.5">Secure checkout via Stripe. Spot confirmed instantly.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {useWaitlist && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-orange-700 font-medium">
                This session is full. Joining the waitlist is free — you&apos;ll be emailed if a spot opens.
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required checked={form.consentAccepted} onChange={e => set('consentAccepted', e.target.checked)} className="mt-0.5 accent-[#0c6162] w-4 h-4 shrink-0" />
                <span className="text-sm text-slate-600">
                  I agree to the program terms, refund policy, and waiver of liability. I confirm all information is accurate. <span className="text-red-500">*</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.photoConsent} onChange={e => set('photoConsent', e.target.checked)} className="mt-0.5 accent-[#0c6162] w-4 h-4 shrink-0" />
                <span className="text-sm text-slate-500">I consent to photos/videos being used for Kriana promotional materials. (Optional)</span>
              </label>
            </div>

            <button type="submit" disabled={submitting} className="w-full py-4 rounded-xl text-white font-black text-base transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm" style={{ backgroundColor: '#0c6162' }}>
              {submitting ? 'Processing…' : useWaitlist ? 'Join Waitlist' : form.paymentMethod === PAYMENT_METHOD.STRIPE ? `Pay ${priceLabel} →` : 'Register & Get E-Transfer Instructions →'}
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
