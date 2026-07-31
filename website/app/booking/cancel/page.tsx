'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LegacyPaymentDisabled } from '../../../components/booking/LegacyPaymentDisabled'
import { isRequestOnlyBookingFlow } from '../../../lib/booking-flow'

function CancelContent() {
  const searchParams = useSearchParams()
  const registrationId = searchParams.get('registration_id')

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-slate-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2.5} className="w-8 h-8">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Payment Cancelled</h1>
        <p className="text-slate-500 mb-8">
          Your registration was not completed. No payment was processed. You can try again below.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/booking" className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white" style={{ backgroundColor: '#0c6162' }}>
            Back to Programs
          </Link>
          {registrationId && <p className="text-xs text-slate-400">Ref: {registrationId}</p>}
        </div>
      </div>
    </div>
  )
}

export default function BookingCancelPage() {
  if (isRequestOnlyBookingFlow) return <LegacyPaymentDisabled />

  return (
    <Suspense fallback={null}>
      <CancelContent />
    </Suspense>
  )
}
