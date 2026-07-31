'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function WaitlistContent() {
  const searchParams = useSearchParams()
  const program = searchParams.get('program')
  const reference = searchParams.get('reference')

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-orange-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth={2.5} className="w-8 h-8">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Waitlist request received</h1>
        <p className="text-slate-500 mb-3">
          {program ? <><strong>{program}</strong> is currently full.</> : 'This weekly program is currently full.'}
        </p>
        <p className="text-slate-500 mb-8">
          We&apos;ve added your request to the waitlist. If a spot opens, we&apos;ll contact you by email with the next steps. A place is not confirmed yet, and no payment is due.
        </p>
        {reference && (
          <div className="mb-6 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Waitlist reference</p>
            <p className="mt-1 font-mono font-bold text-slate-700">{reference}</p>
          </div>
        )}
        <Link href="/booking" className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white" style={{ backgroundColor: '#0c6162' }}>
          Browse More Programs
        </Link>
      </div>
    </div>
  )
}

export default function WaitlistConfirmedPage() {
  return (
    <Suspense fallback={null}>
      <WaitlistContent />
    </Suspense>
  )
}
