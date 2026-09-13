'use client'

import { useState } from 'react'
import Link from 'next/link'

// A confirm button rather than an automatic unsubscribe on page load.
// Corporate mail scanners and link previewers fetch every URL in an email,
// which would silently unsubscribe people who never clicked. One deliberate
// click keeps the mechanism simple enough for CASL while staying immune to
// that. The form POSTs the token; the page never exposes a contact id.
export function UnsubscribeForm({ token }: { token: string }) {
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle')
  const [error, setError] = useState('')

  async function handleUnsubscribe() {
    setError('')
    setStatus('working')
    try {
      const response = await fetch('/.netlify/functions/process-unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.error || 'We could not process your request. Please try again.')
      }
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-teal-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0c6162" strokeWidth={2.5} className="w-8 h-8">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-3">
          You&apos;ve been unsubscribed from Kriana Learning Updates.
        </h1>
        <p className="text-slate-500 mb-8">
          You will no longer receive promotional emails from us. You&apos;ll still get essential
          emails about any program your child is registered for, such as confirmations and invoices.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white"
          style={{ backgroundColor: '#0c6162' }}
        >
          Back to KrianaTutoring.com
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center max-w-md">
      <h1 className="text-2xl font-black text-slate-800 mb-3">
        Unsubscribe from Kriana Learning Updates?
      </h1>
      <p className="text-slate-500 mb-8">
        You&apos;ll stop receiving learning tips, free worksheets, STEM activities and event
        announcements. Emails about a program your child is registered for will continue.
      </p>
      {error && <p className="text-sm font-semibold text-brand-rose mb-4">{error}</p>}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={handleUnsubscribe}
          disabled={status === 'working'}
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white disabled:opacity-50"
          style={{ backgroundColor: '#0c6162' }}
        >
          {status === 'working' ? 'Unsubscribing…' : 'Yes, unsubscribe me'}
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl border border-slate-300 text-slate-700"
        >
          Keep me subscribed
        </Link>
      </div>
    </div>
  )
}
