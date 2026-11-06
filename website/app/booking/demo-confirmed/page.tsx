'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import BookingLayout from '../../../components/booking/BookingLayout'
import { BookingStepper } from '../../../components/booking/BookingStepper'
import { eventTerms } from '../../../lib/demo-event-copy.js'
import { trackEvent } from '../../../lib/analytics'
import { readLastEventParent } from '../../../components/booking/DemoRegisterForm'

// Stripe Checkout's success_url lands here (see
// create-demo-payment-session.js buildCheckoutSessionParams), carrying the
// registration's own reference, event title, amount and credit flag. Stripe
// only redirects here after a card payment succeeded, so this page can say
// "paid". It never reads Firestore itself — demo-payment-webhook.js is the
// source of truth for paymentStatus and sends the payment-received email.
function DemoConfirmedContent() {
  const searchParams = useSearchParams()
  const demoRegistrationId = searchParams.get('demoRegistrationId') ?? ''
  const reference = searchParams.get('reference') || demoRegistrationId
  const eventTitle = searchParams.get('eventTitle') ?? ''
  const programId = searchParams.get('programId') ?? ''
  const amountCents = Number(searchParams.get('amountCents'))
  const currency = searchParams.get('currency') || 'CAD'
  const creditEnabled = searchParams.get('credit') !== '0'
  const terms = eventTerms(searchParams.get('eventType'))
  const amountLabel = Number.isFinite(amountCents) && amountCents > 0 ? `$${(amountCents / 100).toFixed(2)} ${currency}` : ''

  // "Register another child": back to /events with the same session picked
  // and the parent details (saved on this browser at Register) filled in.
  const [anotherHref, setAnotherHref] = useState('/events#book')
  useEffect(() => {
    trackEvent('demo_card_payment_completed')
    const last = readLastEventParent()
    if (last?.offeringId) setAnotherHref(`/events?${new URLSearchParams({ offering: last.offeringId, another: '1' })}#register`)
  }, [])

  return (
    <BookingLayout maxWidth="max-w-lg">
      <BookingStepper step={3} />

      <div className="text-center mb-7">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth={2.5} className="w-8 h-8" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-3">Payment received. You&apos;re booked!</h1>
        <p className="text-slate-500 leading-relaxed">
          Thank you{eventTitle ? <> for registering for <strong className="text-slate-700">{eventTitle}</strong></> : ''}.
          {' '}We&apos;ve emailed your receipt and booking details.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #F2A100, #ED174B)' }} />
        <div className="p-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {reference && (
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Booking reference</p>
                <p className="font-mono font-bold text-slate-700 break-all">{reference}</p>
              </div>
            )}
            {amountLabel && (
              <div className="bg-emerald-50 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Paid by card</p>
                <p className="font-bold text-emerald-800">{amountLabel}</p>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-black text-slate-800 mb-3">What happens next</h2>
            <ol className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3"><span className="font-black text-[#0c6162]">1.</span><span>Check your inbox for the payment-received email (and your spam folder, just in case).</span></li>
              <li className="flex gap-3"><span className="font-black text-[#0c6162]">2.</span><span>We&apos;ll send your confirmation with the final details before the {terms.noun}.</span></li>
              <li className="flex gap-3"><span className="font-black text-[#0c6162]">3.</span><span>{creditEnabled ? 'Your payment is credited toward regular enrollment after your child attends.' : 'Bring your child on the day. We can’t wait to build with them!'}</span></li>
            </ol>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Your card statement will show <strong>Kriana Tutoring</strong>. Questions? Call or text{' '}
            <a href="tel:+16134006921" className="text-[#0c6162] font-semibold hover:underline">613-400-6921</a> or email{' '}
            <a href="mailto:info@krianatutoring.com" className="text-[#0c6162] font-semibold hover:underline">info@krianatutoring.com</a>.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-center sm:flex-row sm:justify-center">
        <a
          href={anotherHref}
          onClick={() => trackEvent('register_another_child_click')}
          className="rounded-xl px-5 py-3 text-sm font-black text-[#1d1300] shadow-sm transition-all hover:opacity-90"
          style={{ backgroundColor: '#F2A100' }}
        >
          Register another child
        </a>
        <Link href="/events" className="rounded-xl px-5 py-3 text-sm font-black text-white shadow-sm transition-all hover:opacity-90" style={{ backgroundColor: '#0c6162' }}>
          Back to Events
        </Link>
        {programId && (
          <Link href="/robotics#programs" className="rounded-xl border border-[#0c6162] px-5 py-3 text-sm font-black text-[#0c6162]">
            Explore Regular Programs
          </Link>
        )}
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
