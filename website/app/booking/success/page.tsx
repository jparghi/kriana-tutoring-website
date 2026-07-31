'use client'

import Link from 'next/link'
import BookingLayout from '../../../components/booking/BookingLayout'
import { BookingStepper } from '../../../components/booking/BookingStepper'
import { LegacyPaymentDisabled } from '../../../components/booking/LegacyPaymentDisabled'
import { isRequestOnlyBookingFlow } from '../../../lib/booking-flow'

export default function BookingSuccessPage() {
  if (isRequestOnlyBookingFlow) return <LegacyPaymentDisabled />

  return (
    <BookingLayout maxWidth="max-w-lg">
      <BookingStepper step={4} />
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#e6f4f4' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#0c6162" strokeWidth={2.5} className="w-8 h-8"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-3">Thank you</h1>
        <p className="text-slate-500">Your credit-card payment was submitted successfully.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #0c6162, #0d9e9f)' }} />
        <div className="p-6 space-y-3 text-sm text-slate-600">
          <p>Stripe will email your payment receipt.</p>
          <p>Kriana will verify the payment and send your final program enrollment confirmation separately.</p>
          <p className="font-semibold text-slate-700">Please keep your registration number for your records.</p>
        </div>
      </div>

      <div className="flex flex-col items-stretch sm:flex-row sm:items-center sm:justify-center gap-3">
        <Link href="/booking" className="inline-flex items-center justify-center gap-2 text-sm font-bold px-5 py-3 sm:py-2.5 rounded-xl text-white transition-all hover:opacity-90 w-full sm:w-auto" style={{ backgroundColor: '#0c6162' }}>
          Browse More Programs →
        </Link>
      </div>
    </BookingLayout>
  )
}
