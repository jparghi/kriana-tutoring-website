'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import BookingLayout from '../../../components/booking/BookingLayout'
import { BookingStepper } from '../../../components/booking/BookingStepper'

// Stripe Checkout success_url lands here with ?demoRegistrationId=... (see
// create-demo-payment-session.js). This page never re-fetches or displays
// payment state itself — the webhook is the source of truth for
// paymentStatus, and this page's job is purely to acknowledge the $10
// payment and point the family at the regular package options. It must NOT
// say "no payment is due today" — that would be false for a demo where a
// $10 charge was already collected via Stripe.
function DemoConfirmedContent() {
  const searchParams = useSearchParams()
  const demoRegistrationId = searchParams.get('demoRegistrationId')
  const program = searchParams.get('program')
  const programId = searchParams.get('programId')

  return (
    <BookingLayout maxWidth="max-w-lg">
      <BookingStepper step={3} />

      <div className="text-center mb-7">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-amber-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="#F2A100" strokeWidth={2.5} className="w-8 h-8" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-3">Your $10 demo payment was received</h1>
        <p className="text-slate-500 leading-relaxed">
          Thank you{program ? <> for registering for <strong className="text-slate-700">{program}</strong></> : ''}.
          {' '}We received your $10 CAD payment and your child&apos;s demo class registration.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #F2A100, #ED174B)' }} />
        <div className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-sm text-amber-700 font-bold">Try for $10 — Demo is FREE when you enroll.</p>
            <p className="text-sm text-amber-700 mt-1">
              The $10 is credited toward regular enrollment after your child attends.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-black text-slate-800 mb-3">What happens next</h2>
            <ol className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3"><span className="font-black text-[#0c6162]">1.</span><span>Our team confirms your child&apos;s demo class time.</span></li>
              <li className="flex gap-3"><span className="font-black text-[#0c6162]">2.</span><span>Your child attends the demo class.</span></li>
              <li className="flex gap-3"><span className="font-black text-[#0c6162]">3.</span><span>Your $10 is automatically credited if you enroll in a regular package.</span></li>
            </ol>
          </div>

          {demoRegistrationId && (
            <div className="bg-slate-50 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Demo Registration Reference</p>
              <p className="font-mono font-bold text-slate-700 break-all">{demoRegistrationId}</p>
            </div>
          )}

          <p className="text-xs text-slate-500 leading-relaxed">
            Questions? Email <a href="mailto:info@krianatutoring.com" className="text-[#0c6162] font-semibold hover:underline">info@krianatutoring.com</a>.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#0083CB]/25 shadow-sm p-6 text-center mb-6">
        <p className="text-sm font-bold text-slate-800">Ready to enroll in a full package?</p>
        <p className="mt-1 text-sm text-slate-500">Explore Explorer, Builder, and Engineer — your $10 demo credit applies automatically after attendance.</p>
        {programId && (
          <Link
            href={`/booking/${programId}`}
            className="mt-4 inline-block rounded-xl px-5 py-3 text-sm font-black text-white shadow-sm transition-all hover:opacity-90"
            style={{ backgroundColor: '#0c6162' }}
          >
            Choose Your Regular Package →
          </Link>
        )}
      </div>

      <div className="text-center">
        <Link href="/booking" className="text-sm font-semibold text-[#0c6162] hover:underline">Browse More Programs →</Link>
      </div>
    </BookingLayout>
  )
}

export default function DemoConfirmedPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-400">Loading…</div>}>
      <DemoConfirmedContent />
    </Suspense>
  )
}
