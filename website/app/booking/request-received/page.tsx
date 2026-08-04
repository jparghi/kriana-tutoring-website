'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import BookingLayout from '../../../components/booking/BookingLayout'
import { BookingStepper } from '../../../components/booking/BookingStepper'

function RequestReceivedContent() {
  const searchParams = useSearchParams()
  const program = searchParams.get('program')
  const reference = searchParams.get('reference')

  return (
    <BookingLayout maxWidth="max-w-lg">
      <BookingStepper step={3} />

      <div className="text-center mb-7">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#e6f4f4]">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0c6162" strokeWidth={2.5} className="w-8 h-8" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-3">Your request was received</h1>
        <p className="text-slate-500 leading-relaxed">
          Thank you{program ? <> for your interest in <strong className="text-slate-700">{program}</strong></> : ''}.
          {' '}Our team will review availability and contact you with the next steps.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0c6162, #0d9e9f)' }} />
        <div className="p-6 space-y-5">
          <div className="bg-[#e6f4f4] border border-[#0c6162]/15 rounded-xl px-4 py-3">
            <p className="text-sm text-[#0c6162] font-bold">No payment is due today.</p>
            <p className="text-sm text-slate-600 mt-1">
              Submitting a request does not confirm a seat. We will confirm the schedule, placement, and payment details separately.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-black text-slate-800 mb-3">What happens next</h2>
            <ol className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3"><span className="font-black text-[#0c6162]">1.</span><span>We review program availability and your child&apos;s information.</span></li>
              <li className="flex gap-3"><span className="font-black text-[#0c6162]">2.</span><span>We contact you to confirm placement or discuss another suitable option.</span></li>
              <li className="flex gap-3"><span className="font-black text-[#0c6162]">3.</span><span>Payment instructions are provided only after a place is offered.</span></li>
            </ol>
          </div>

          {reference && (
            <div className="bg-slate-50 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Request Reference</p>
              <p className="font-mono font-bold text-slate-700">{reference}</p>
            </div>
          )}

          <p className="text-xs text-slate-500 leading-relaxed">
            Questions? Email <a href="mailto:info@krianatutoring.com" className="text-[#0c6162] font-semibold hover:underline">info@krianatutoring.com</a>.
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link href="/booking" className="text-sm font-semibold text-[#0c6162] hover:underline">Browse More Programs →</Link>
      </div>
    </BookingLayout>
  )
}

export default function RequestReceivedPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-400">Loading…</div>}>
      <RequestReceivedContent />
    </Suspense>
  )
}

