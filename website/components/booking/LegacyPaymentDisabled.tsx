'use client'

import Link from 'next/link'
import BookingLayout from './BookingLayout'

export function LegacyPaymentDisabled({ reference }: { reference?: string }) {
  return (
    <BookingLayout maxWidth="max-w-lg">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden my-8">
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #0c6162, #0d9e9f)' }} />
        <div className="p-7 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#e6f4f4]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0c6162" strokeWidth={2} className="w-7 h-7" aria-hidden="true">
              <path d="M12 8v4l3 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">Payment comes after review</h1>
          <p className="text-slate-500 leading-relaxed mb-3">
            We are not collecting online or e-transfer payments during registration right now.
            Please submit a program request first, and our team will confirm availability and payment details with you.
          </p>
          <p className="text-sm font-semibold text-[#0c6162] mb-7">No payment has been processed from this page.</p>
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0c6162' }}
            >
              Browse Programs
            </Link>
            <a
              href="mailto:info@krianatutoring.com"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50"
            >
              Contact Us
            </a>
          </div>
          {reference && <p className="text-xs font-mono text-slate-400 mt-5">Reference: {reference}</p>}
        </div>
      </div>
    </BookingLayout>
  )
}

